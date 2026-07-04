// upload-user-media: handles files >5MB by uploading through service_role
// into the `user-media-large` bucket. Enforces per-tier size limits and
// scopes the storage path to the authenticated user's folder.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, createErrorResponse, createSuccessResponse, getSupabaseUser } from '../_shared/utils.ts';

const FREE_MAX = 10 * 1024 * 1024; // 10MB
const PRO_MAX = 30 * 1024 * 1024;  // 30MB

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { user, error: authError } = await getSupabaseUser(req);
    if (authError || !user) return createErrorResponse('Unauthorized', 401);

    const form = await req.formData();
    const file = form.get('file');
    const providedPath = String(form.get('path') || '');
    const contentType = String(form.get('contentType') || 'application/octet-stream');

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

    const maxBytes = profile?.is_premium ? PRO_MAX : FREE_MAX;
    if (file.size > maxBytes) {
      return createErrorResponse(
        `File too large. Max ${Math.round(maxBytes / (1024 * 1024))}MB for your plan.`,
        413,
      );
    }

    const bucket = 'user-media-large';
    const bytes = new Uint8Array(await file.arrayBuffer());

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
