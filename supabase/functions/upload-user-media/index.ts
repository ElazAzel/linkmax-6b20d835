// upload-user-media: handles files >5MB by uploading through service_role
// into the `user-media-large` bucket. Enforces per-tier size limits and
// scopes the storage path to the authenticated user's folder.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createErrorResponse, createSuccessResponse, getSupabaseUser } from '../_shared/utils.ts';

const FREE_MAX = 10 * 1024 * 1024; // 10MB
const PRO_MAX = 30 * 1024 * 1024;  // 30MB

const ALLOWED_EXT: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/gif': ['gif'],
  'image/webp': ['webp'],
  'video/mp4': ['mp4', 'm4v', 'mov'],
  'video/webm': ['webm'],
};

// Detect type from file signature; never trust client-supplied content types.
function sniffMediaType(b: Uint8Array): string | null {
  const at = (i: number, sig: number[]) => sig.every((v, k) => b[i + k] === v);
  if (at(0, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (at(0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (at(0, [0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (at(0, [0x52, 0x49, 0x46, 0x46]) && at(8, [0x57, 0x45, 0x42, 0x50])) return 'image/webp';
  if (at(4, [0x66, 0x74, 0x79, 0x70])) return 'video/mp4';
  if (at(0, [0x1a, 0x45, 0xdf, 0xa3])) return 'video/webm';
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, error: authError } = await getSupabaseUser(req);
    if (authError || !user) return createErrorResponse('Unauthorized', 401);

    const form = await req.formData();
    const file = form.get('file');
    const providedPath = String(form.get('path') || '');

    if (!(file instanceof File)) return createErrorResponse('Missing file', 400);

    // Path must be scoped under the user's own folder
    if (!providedPath.startsWith(`${user.id}/`)) {
      return createErrorResponse('Invalid path', 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Determine tier
    const { data: profile } = await admin
      .from('user_profiles')
      .select('is_premium')
      .eq('id', user.id)
      .maybeSingle();

    const premiumActive = !!profile?.is_premium &&
      (!profile?.premium_expires_at || new Date(profile.premium_expires_at).getTime() > Date.now());
    const maxBytes = premiumActive ? PRO_MAX : FREE_MAX;
    if (file.size > maxBytes) {
      return createErrorResponse(
        `File too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB for your plan.`,
        413,
      );
    }

    const bucket = 'user-media-large';
    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = sniffMediaType(bytes);
    if (!contentType) return createErrorResponse('Unsupported file type', 415);
    const ext = providedPath.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT[contentType].includes(ext)) return createErrorResponse('File extension does not match content', 400);

    const { error: uploadError } = await admin.storage
      .from(bucket)
      .upload(providedPath, bytes, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) return createErrorResponse(uploadError.message, 500);

    const { data } = admin.storage.from(bucket).getPublicUrl(providedPath);
    return createSuccessResponse({ publicUrl: data.publicUrl, path: providedPath, bucket });
  } catch (err) {
    return createErrorResponse(err as Error, 500);
  }
});
