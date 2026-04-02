-- ROLLBACK SCRIPT FOR PHASE 12: PLATFORM HARDENING
-- Use this script to revert database changes if critical issues arise.

-- 1. Revert Media Lifecycle
DROP TRIGGER IF EXISTS on_block_content_update ON blocks;
DROP FUNCTION IF EXISTS public.update_media_references();
DROP TABLE IF EXISTS public.media_references;
DROP TABLE IF EXISTS public.media_assets;

-- 2. Revert Notification Orchestrator
DROP TABLE IF EXISTS public.notification_queue;

-- 3. Revert Analytics Hardening (Partial - keep column but restore CASCADE if needed)
-- Note: Re-adding CASCADE is risky if data was already saved. 
-- Better to just leave it as SET NULL for safety.
-- ALTER TABLE public.analytics 
-- DROP CONSTRAINT analytics_block_id_fkey,
-- ADD CONSTRAINT analytics_block_id_fkey FOREIGN KEY (block_id) REFERENCES blocks(id) ON DELETE CASCADE;

-- 4. Revert blocks.deleted_at (Optional - column can stay without harm)
-- ALTER TABLE public.blocks DROP COLUMN IF EXISTS deleted_at;

-- 5. Restore original save_page_blocks (Approximate - assuming original was DELETE/INSERT)
-- This is already handled by the migration's "versioning" but if you need to 
-- physically restore the old function code, refer to 20260309024416 migration.
