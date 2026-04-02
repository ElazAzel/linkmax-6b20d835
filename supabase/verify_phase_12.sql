-- VERIFICATION SCRIPT FOR PHASE 12: PLATFORM HARDENING
-- Run this in Supabase Dashboard SQL Editor to verify the results.

-- 1. Check Tables Existence
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
AND table_name IN ('notification_queue', 'media_assets', 'media_references');

-- 2. Verify Blocks.deleted_at exists
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'blocks' AND column_name = 'deleted_at';

-- 3. Verify Analytics constraints (SET NULL)
SELECT confdeltype FROM pg_constraint 
WHERE conname = 'analytics_block_id_fkey' OR conname = 'public_analytics_block_id_fkey';
-- 'r' means RESTRICT, 'c' means CASCADE, 'n' means SET NULL. 
-- We expect 'n'.

-- 4. Verify save_page_blocks logic (Dry Run TEST)
-- DO NOT RUN unless you want to test a real page save.
-- SELECT save_page_blocks('YOUR_PAGE_UUID', '[]', false);

-- 5. Test Notification Queue Insert
-- INSERT INTO notification_queue (user_id, event_type, payload, status)
-- VALUES ('YOUR_USER_UUID', 'test_event', '{"msg": "Hello"}', 'pending');
-- Check if it shows up:
-- SELECT * FROM notification_queue ORDER BY created_at DESC LIMIT 5;

-- 6. Media Tracking Trigger Check
-- INSERT a dummy block and check if media_references is populated.
-- (This should be done carefully with a test account).
