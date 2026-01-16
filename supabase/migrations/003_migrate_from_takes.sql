-- ============================================
-- MIGRATION FROM OLD SYSTEM TO NEW
-- ============================================
-- Migrate from "tracks + takes" to "repositories + commits + stems"
-- Then drop old tables

-- ============================================
-- 1. CREATE REPOSITORIES FOR EXISTING PROJECTS
-- ============================================

INSERT INTO repositories (project_id, default_branch, created_at)
SELECT
    id,
    'main',
    created_at
FROM projects
ON CONFLICT (project_id) DO NOTHING;

-- ============================================
-- 2. CREATE MAIN BRANCH FOR EACH REPOSITORY
-- ============================================

INSERT INTO branches (repository_id, name, created_by, created_at)
SELECT
    r.id,
    'main',
    p.owner_id,
    p.created_at
FROM repositories r
JOIN projects p ON r.project_id = p.id
ON CONFLICT (repository_id, name) DO NOTHING;

-- ============================================
-- 3. MIGRATE TAKES TO COMMITS
-- ============================================

-- For each track with takes, create commits
-- Each take becomes a commit with one stem

DO $$
DECLARE
    track_record RECORD;
    take_record RECORD;
    repo_id UUID;
    branch_id UUID;
    commit_id UUID;
    prev_commit_id UUID;
    file_id UUID;
    file_hash_value TEXT;
BEGIN
    -- Loop through all tracks
    FOR track_record IN
        SELECT t.*, p.id as project_id, p.owner_id
        FROM tracks t
        JOIN projects p ON t.project_id = p.id
        ORDER BY t.created_at
    LOOP
        -- Get repository and branch
        SELECT r.id INTO repo_id FROM repositories r WHERE r.project_id = track_record.project_id;
        SELECT b.id INTO branch_id FROM branches b WHERE b.repository_id = repo_id AND b.name = 'main';

        -- Reset parent commit for each track
        prev_commit_id := NULL;

        -- Loop through takes for this track (ordered by creation)
        FOR take_record IN
            SELECT *
            FROM takes
            WHERE track_id = track_record.id
            ORDER BY created_at ASC
        LOOP
            -- Generate a simple hash for the file (using URL as proxy since we don't have actual file)
            -- In production, you'd hash the actual file content
            file_hash_value := encode(digest(take_record.audio_url, 'sha256'), 'hex');

            -- Check if file already exists in storage
            SELECT id INTO file_id FROM file_storage WHERE file_hash = file_hash_value;

            -- If file doesn't exist, create it
            IF file_id IS NULL THEN
                INSERT INTO file_storage (
                    file_hash,
                    storage_url,
                    storage_path,
                    file_size_bytes,
                    file_format,
                    mime_type,
                    duration,
                    sample_rate,
                    bit_depth,
                    channels,
                    waveform_data,
                    uploaded_by,
                    created_at
                )
                VALUES (
                    file_hash_value,
                    take_record.audio_url,
                    take_record.audio_url, -- Reuse URL as path for now
                    COALESCE(take_record.file_size, 0),
                    COALESCE(take_record.file_format, 'unknown'),
                    CASE
                        WHEN take_record.file_format = 'wav' THEN 'audio/wav'
                        WHEN take_record.file_format = 'mp3' THEN 'audio/mpeg'
                        WHEN take_record.file_format = 'aiff' THEN 'audio/aiff'
                        ELSE 'audio/mpeg'
                    END,
                    take_record.duration,
                    44100, -- Default sample rate (we don't have this info)
                    16,    -- Default bit depth
                    2,     -- Default stereo
                    take_record.waveform_data,
                    track_record.owner_id,
                    take_record.created_at
                )
                RETURNING id INTO file_id;
            END IF;

            -- Create commit for this take
            INSERT INTO commits (
                repository_id,
                branch_id,
                parent_commit_id,
                author_id,
                message,
                created_at
            )
            VALUES (
                repo_id,
                branch_id,
                prev_commit_id,
                track_record.owner_id,
                CASE
                    WHEN prev_commit_id IS NULL THEN 'Initial commit: ' || track_record.name
                    ELSE 'Updated ' || track_record.name
                END,
                take_record.created_at
            )
            RETURNING id INTO commit_id;

            -- Create stem for this commit
            INSERT INTO stems (
                commit_id,
                track_name,
                track_index,
                track_color,
                stem_type,
                audio_file_id,
                audio_url,
                duration,
                waveform_data,
                created_at
            )
            VALUES (
                commit_id,
                track_record.name,
                track_record.order_index,
                track_record.color,
                'audio',
                file_id,
                take_record.audio_url,
                take_record.duration,
                take_record.waveform_data,
                take_record.created_at
            );

            -- This commit becomes parent for next take
            prev_commit_id := commit_id;

        END LOOP;

        -- Update branch head to point to last commit
        IF commit_id IS NOT NULL THEN
            UPDATE branches
            SET head_commit_id = commit_id
            WHERE id = branch_id;
        END IF;

    END LOOP;
END $$;

-- ============================================
-- 4. MIGRATE COMMENTS TO COMMITS
-- ============================================

-- Update comments to reference commits instead of tracks
-- Link each comment to the most recent commit on the track at the time of comment

UPDATE comments c
SET commit_id = (
    SELECT cm.id
    FROM commits cm
    JOIN branches b ON cm.branch_id = b.id
    JOIN repositories r ON b.repository_id = r.id
    JOIN tracks t ON r.project_id = t.project_id
    WHERE t.id = c.track_id
    AND cm.created_at <= c.created_at
    ORDER BY cm.created_at DESC
    LIMIT 1
)
WHERE c.track_id IS NOT NULL;

-- ============================================
-- 5. DROP OLD TABLES
-- ============================================

-- Drop old tables that are no longer needed
DROP TABLE IF EXISTS takes CASCADE;
DROP TABLE IF EXISTS tracks CASCADE;
DROP TABLE IF EXISTS mixer_settings CASCADE;

-- Note: Keep 'projects' table as it's still used
-- Note: Keep 'comments' table but it now references commits

-- ============================================
-- 6. UPDATE COMMENTS TABLE
-- ============================================

-- Make commit_id required now
ALTER TABLE comments ALTER COLUMN commit_id SET NOT NULL;

-- Drop old track_id column
ALTER TABLE comments DROP COLUMN IF EXISTS track_id;

-- ============================================
-- 7. CLEANUP
-- ============================================

-- Remove orphaned files (reference_count = 0)
-- This is done via a scheduled job, not immediately

-- Create function for cleanup
CREATE OR REPLACE FUNCTION cleanup_orphaned_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete files with no references and older than 24 hours
    DELETE FROM file_storage
    WHERE reference_count = 0
    AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING COUNT(*) INTO deleted_count;

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. VERIFY MIGRATION
-- ============================================

-- Count summary
DO $$
DECLARE
    repo_count INTEGER;
    branch_count INTEGER;
    commit_count INTEGER;
    stem_count INTEGER;
    file_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO repo_count FROM repositories;
    SELECT COUNT(*) INTO branch_count FROM branches;
    SELECT COUNT(*) INTO commit_count FROM commits;
    SELECT COUNT(*) INTO stem_count FROM stems;
    SELECT COUNT(*) INTO file_count FROM file_storage;

    RAISE NOTICE 'Migration complete:';
    RAISE NOTICE '  Repositories: %', repo_count;
    RAISE NOTICE '  Branches: %', branch_count;
    RAISE NOTICE '  Commits: %', commit_count;
    RAISE NOTICE '  Stems: %', stem_count;
    RAISE NOTICE '  Files (deduplicated): %', file_count;
END $$;
