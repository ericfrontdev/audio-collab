-- ============================================================================
-- SIMPLIFY RETAKES: Single Source of Truth
-- ============================================================================
-- Remove is_active from takes, use ONLY active_take_id on tracks
-- This eliminates all synchronization issues and trigger bugs
--
-- Design:
-- - project_tracks.active_take_id points to the currently active take
-- - No more is_active boolean to keep in sync
-- - No more triggers trying to maintain consistency
-- ============================================================================

-- ============================================================================
-- 1. Remove ALL triggers on project_takes
-- ============================================================================

DO $$
DECLARE
  trigger_rec RECORD;
BEGIN
  FOR trigger_rec IN
    SELECT t.tgname
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    WHERE c.relname = 'project_takes'
      AND NOT t.tgisinternal
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON project_takes CASCADE', trigger_rec.tgname);
    RAISE NOTICE 'Dropped trigger: %', trigger_rec.tgname;
  END LOOP;
END $$;

-- Drop associated functions
DROP FUNCTION IF EXISTS ensure_single_active_take() CASCADE;
DROP FUNCTION IF EXISTS set_first_take_as_active() CASCADE;

-- ============================================================================
-- 2. Populate active_take_id for tracks that don't have one
-- ============================================================================

-- Set active_take_id to the first take (oldest) for tracks where it's NULL
UPDATE project_tracks pt
SET active_take_id = (
  SELECT id FROM project_takes
  WHERE track_id = pt.id
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE active_take_id IS NULL
  AND EXISTS (SELECT 1 FROM project_takes WHERE track_id = pt.id);

-- ============================================================================
-- 3. Remove is_active column from project_takes
-- ============================================================================

ALTER TABLE project_takes DROP COLUMN IF EXISTS is_active;

-- ============================================================================
-- 4. Add updated_at trigger to project_tracks (if not exists)
-- ============================================================================

-- This ensures active_take_id changes update the timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_project_tracks_updated_at'
  ) THEN
    CREATE TRIGGER update_project_tracks_updated_at
      BEFORE UPDATE ON project_tracks
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 5. Summary
-- ============================================================================

DO $$
DECLARE
  tracks_with_active INTEGER;
  tracks_without_active INTEGER;
  total_takes INTEGER;
BEGIN
  SELECT COUNT(*) INTO tracks_with_active
  FROM project_tracks WHERE active_take_id IS NOT NULL;

  SELECT COUNT(*) INTO tracks_without_active
  FROM project_tracks WHERE active_take_id IS NULL;

  SELECT COUNT(*) INTO total_takes FROM project_takes;

  RAISE NOTICE '=== RETAKES MIGRATION COMPLETE ===';
  RAISE NOTICE 'Tracks with active_take_id: %', tracks_with_active;
  RAISE NOTICE 'Tracks without active_take_id: %', tracks_without_active;
  RAISE NOTICE 'Total takes: %', total_takes;
  RAISE NOTICE 'is_active column: REMOVED';
  RAISE NOTICE 'Triggers on project_takes: REMOVED';
  RAISE NOTICE 'Single source of truth: active_take_id';
END $$;
