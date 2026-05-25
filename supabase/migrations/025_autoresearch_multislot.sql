-- 025: AutoResearch Multi-Slot A/B Architecture
-- Campaigns now have N video slots tested simultaneously per round

-- 1. Add multi-slot columns to campaigns
ALTER TABLE autoresearch_campaigns
  ADD COLUMN IF NOT EXISTS slots JSONB,
  ADD COLUMN IF NOT EXISTS slot_count INT NOT NULL DEFAULT 5;

-- 2. Make vturb_video_id nullable (new campaigns use slots instead)
ALTER TABLE autoresearch_campaigns
  ALTER COLUMN vturb_video_id DROP NOT NULL;

-- 3. Add multi-slot columns to iterations (rounds)
ALTER TABLE autoresearch_iterations
  ADD COLUMN IF NOT EXISTS variants JSONB,
  ADD COLUMN IF NOT EXISTS slot_results JSONB,
  ADD COLUMN IF NOT EXISTS winner_slot INT;

-- 4. Migrate existing single-video campaigns to slots format
UPDATE autoresearch_campaigns
  SET slots = jsonb_build_array(
    jsonb_build_object('video_id', vturb_video_id, 'label', 'Slot A')
  ),
  slot_count = 1
  WHERE slots IS NULL AND vturb_video_id IS NOT NULL;
