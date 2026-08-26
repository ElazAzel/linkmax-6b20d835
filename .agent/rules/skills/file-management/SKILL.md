---
name: file-management
description: User media uploads, Supabase Storage bucketing, image optimization, and orphaned file cleanup.
---

# File & Storage Management

Use for media uploads, image cropping, file validation, Supabase Storage bucket policies, and orphaned asset cleanup in LinkMAX.

## When to Use
- Implementing or modifying media upload controls (`MediaUpload`, `react-image-crop`).
- Managing Supabase Storage buckets (`avatars`, `page-media`, `digital-goods`).
- Optimizing images and media delivery for high-speed mobile loading.
- Cleaning up orphaned files (`cleanup-orphaned-media` Edge Function).

## Core Workflows

### 1. User Media Uploads & Cropping
1. User selects image (avatar, cover, gallery photo, block media).
2. Validate file type (e.g. `image/jpeg`, `image/png`, `image/webp`) and file size limit (e.g. <= 10MB) in client.
3. Allow user to crop and adjust aspect ratio via `react-image-crop` in `src/components/form-fields/MediaUpload.tsx`.
4. Upload via Supabase Storage client or `upload-user-media` Edge Function with user-scoped storage path: `${userId}/${uniqueId}.${ext}`.

### 2. Digital Goods Upload & Secure Downloads
1. Sellers upload digital assets (PDFs, ZIPs, templates) to private `digital-goods` storage bucket.
2. Direct download is locked behind signed Supabase Storage URLs generated only upon verified purchase in `digital-goods-download` Edge Function.

### 3. Storage Garbage Collection
1. Run `supabase/functions/cleanup-orphaned-media` on a scheduled cron.
2. Scan storage buckets for unreferenced media files and purge securely.

## Key Files & Services
- **Components**: `src/components/form-fields/MediaUpload.tsx`
- **Edge Functions**: `supabase/functions/upload-user-media`, `supabase/functions/digital-goods-download`, `supabase/functions/cleanup-orphaned-media`
- **Storage Utilities**: `src/lib/storage.ts`

## Commands & Verification
```bash
npm run test -- src/components/form-fields/__tests__/MediaUpload.test.ts
```

## Best Practices & Guardrails
- **MIME Sniffing Prevention**: Always validate file content types on both client and server before storing.
- **Secure Access**: Keep digital product assets in private buckets; never expose raw public URLs.
- **Compression**: Encourage modern WebP format with reasonable dimensions to maintain under 200KB per image payload.
