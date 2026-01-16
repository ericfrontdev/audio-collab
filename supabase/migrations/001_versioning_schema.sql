-- ============================================
-- GIT FOR MUSIC - VERSIONING SYSTEM
-- ============================================
-- Migration: Replace "takes" system with Git-like commits
-- Deduplication: Files stored once via SHA-256 hash

-- ============================================
-- 1. FILE STORAGE (deduplication layer)
-- ============================================

-- Store actual files with hash-based deduplication
CREATE TABLE file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Hash for deduplication (SHA-256)
    file_hash TEXT NOT NULL UNIQUE,

    -- Storage URL (Supabase Storage)
    storage_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,

    -- File metadata
    file_size_bytes BIGINT NOT NULL,
    file_format TEXT NOT NULL, -- 'wav', 'mp3', 'aiff', 'mid', etc.
    mime_type TEXT NOT NULL,

    -- Audio-specific metadata (NULL for MIDI)
    duration REAL,
    sample_rate INTEGER,
    bit_depth INTEGER,
    channels INTEGER,

    -- Waveform data for preview (NULL for MIDI)
    waveform_data JSONB,

    -- Reference counting for cleanup
    reference_count INTEGER DEFAULT 0,

    -- First uploaded
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_storage_hash ON file_storage(file_hash);
CREATE INDEX idx_file_storage_format ON file_storage(file_format);

-- ============================================
-- 2. REPOSITORIES
-- ============================================

CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Default branch
    default_branch TEXT DEFAULT 'main',

    -- Settings
    settings JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id)
);

CREATE INDEX idx_repositories_project ON repositories(project_id);

-- ============================================
-- 3. BRANCHES
-- ============================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,

    name TEXT NOT NULL,
    head_commit_id UUID, -- References commits(id), added after commits table

    -- Metadata
    description TEXT,
    created_by UUID REFERENCES profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(repository_id, name)
);

CREATE INDEX idx_branches_repo ON branches(repository_id);
CREATE INDEX idx_branches_head ON branches(head_commit_id);

-- ============================================
-- 4. COMMITS
-- ============================================

CREATE TABLE commits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    -- Parent commit (NULL for initial commit)
    parent_commit_id UUID REFERENCES commits(id) ON DELETE SET NULL,

    -- Commit info
    author_id UUID NOT NULL REFERENCES profiles(id),
    message TEXT NOT NULL,

    -- Stats (computed from stems)
    stem_count INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_commits_repo ON commits(repository_id);
CREATE INDEX idx_commits_branch ON commits(branch_id);
CREATE INDEX idx_commits_parent ON commits(parent_commit_id);
CREATE INDEX idx_commits_author ON commits(author_id);
CREATE INDEX idx_commits_created ON commits(created_at DESC);

-- Add foreign key to branches.head_commit_id now that commits table exists
ALTER TABLE branches ADD CONSTRAINT fk_branches_head_commit
    FOREIGN KEY (head_commit_id) REFERENCES commits(id) ON DELETE SET NULL;

-- ============================================
-- 5. STEMS (files in commits)
-- ============================================

CREATE TABLE stems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,

    -- Track info
    track_name TEXT NOT NULL,
    track_index INTEGER DEFAULT 0, -- Order in DAW
    track_color TEXT, -- Hex color from DAW

    -- Stem type
    stem_type TEXT NOT NULL CHECK (stem_type IN ('audio', 'midi', 'both')),

    -- File references (deduplication via file_storage)
    audio_file_id UUID REFERENCES file_storage(id) ON DELETE SET NULL,
    midi_file_id UUID REFERENCES file_storage(id) ON DELETE SET NULL,

    -- MIDI data (stored directly for small size)
    midi_data JSONB, -- For 'midi' or 'both' types

    -- Quick access to file info (denormalized for performance)
    audio_url TEXT,
    duration REAL,
    waveform_data JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stems_commit ON stems(commit_id);
CREATE INDEX idx_stems_audio_file ON stems(audio_file_id);
CREATE INDEX idx_stems_midi_file ON stems(midi_file_id);
CREATE INDEX idx_stems_track_name ON stems(track_name);

-- ============================================
-- 6. TAGS (version markers)
-- ============================================

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commit_id UUID NOT NULL REFERENCES commits(id) ON DELETE CASCADE,

    name TEXT NOT NULL, -- "v1.0", "final-mix", "client-approved"
    description TEXT,

    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(repository_id, name)
);

CREATE INDEX idx_tags_repo ON tags(repository_id);
CREATE INDEX idx_tags_commit ON tags(commit_id);

-- ============================================
-- 7. MERGES
-- ============================================

CREATE TABLE merges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,

    source_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    target_branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    merge_commit_id UUID REFERENCES commits(id) ON DELETE SET NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'conflicted', 'cancelled')),

    -- Conflicts data
    conflicts JSONB, -- [{stem_name, source_file, target_file, resolution}]
    resolution JSONB, -- User's resolution choices

    merged_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_merges_repo ON merges(repository_id);
CREATE INDEX idx_merges_source ON merges(source_branch_id);
CREATE INDEX idx_merges_target ON merges(target_branch_id);
CREATE INDEX idx_merges_status ON merges(status);

-- ============================================
-- 8. COMMENTS (update to reference commits)
-- ============================================

-- Add commit reference to existing comments table
ALTER TABLE comments ADD COLUMN commit_id UUID REFERENCES commits(id) ON DELETE CASCADE;
CREATE INDEX idx_comments_commit ON comments(commit_id);

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Update repository.updated_at on changes
CREATE OR REPLACE FUNCTION update_repository_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE repositories
    SET updated_at = NOW()
    WHERE id = NEW.repository_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_repo_on_commit
    AFTER INSERT ON commits
    FOR EACH ROW EXECUTE FUNCTION update_repository_timestamp();

CREATE TRIGGER trigger_update_repo_on_branch
    AFTER INSERT ON branches
    FOR EACH ROW EXECUTE FUNCTION update_repository_timestamp();

-- Update commit stats when stems are added
CREATE OR REPLACE FUNCTION update_commit_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE commits
    SET
        stem_count = (SELECT COUNT(*) FROM stems WHERE commit_id = NEW.commit_id),
        total_size_bytes = (
            SELECT COALESCE(SUM(fs.file_size_bytes), 0)
            FROM stems s
            LEFT JOIN file_storage fs ON s.audio_file_id = fs.id OR s.midi_file_id = fs.id
            WHERE s.commit_id = NEW.commit_id
        )
    WHERE id = NEW.commit_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_commit_stats
    AFTER INSERT OR UPDATE ON stems
    FOR EACH ROW EXECUTE FUNCTION update_commit_stats();

-- Update file_storage reference count
CREATE OR REPLACE FUNCTION update_file_reference_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Increment for new references
    IF TG_OP = 'INSERT' THEN
        IF NEW.audio_file_id IS NOT NULL THEN
            UPDATE file_storage
            SET reference_count = reference_count + 1
            WHERE id = NEW.audio_file_id;
        END IF;
        IF NEW.midi_file_id IS NOT NULL THEN
            UPDATE file_storage
            SET reference_count = reference_count + 1
            WHERE id = NEW.midi_file_id;
        END IF;
    END IF;

    -- Decrement for removed references
    IF TG_OP = 'DELETE' THEN
        IF OLD.audio_file_id IS NOT NULL THEN
            UPDATE file_storage
            SET reference_count = reference_count - 1
            WHERE id = OLD.audio_file_id;
        END IF;
        IF OLD.midi_file_id IS NOT NULL THEN
            UPDATE file_storage
            SET reference_count = reference_count - 1
            WHERE id = OLD.midi_file_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_file_reference_count
    AFTER INSERT OR DELETE ON stems
    FOR EACH ROW EXECUTE FUNCTION update_file_reference_count();

-- ============================================
-- 10. FUNCTIONS
-- ============================================

-- Get commit history for a branch
CREATE OR REPLACE FUNCTION get_commit_history(branch_uuid UUID, limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
    commit_id UUID,
    message TEXT,
    author_id UUID,
    author_username TEXT,
    stem_count INTEGER,
    total_size_bytes BIGINT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE commit_chain AS (
        -- Start with head commit of branch
        SELECT
            c.id, c.message, c.author_id, c.stem_count, c.total_size_bytes, c.created_at, c.parent_commit_id,
            0 AS depth
        FROM commits c
        JOIN branches b ON b.head_commit_id = c.id
        WHERE b.id = branch_uuid

        UNION ALL

        -- Follow parent commits
        SELECT
            c.id, c.message, c.author_id, c.stem_count, c.total_size_bytes, c.created_at, c.parent_commit_id,
            cc.depth + 1
        FROM commits c
        JOIN commit_chain cc ON c.id = cc.parent_commit_id
        WHERE cc.depth < limit_count
    )
    SELECT
        cc.id,
        cc.message,
        cc.author_id,
        p.username,
        cc.stem_count,
        cc.total_size_bytes,
        cc.created_at
    FROM commit_chain cc
    LEFT JOIN profiles p ON p.id = cc.author_id
    ORDER BY cc.depth ASC;
END;
$$ LANGUAGE plpgsql;

-- Check if file exists by hash (for deduplication)
CREATE OR REPLACE FUNCTION find_file_by_hash(hash TEXT)
RETURNS UUID AS $$
DECLARE
    file_id UUID;
BEGIN
    SELECT id INTO file_id FROM file_storage WHERE file_hash = hash LIMIT 1;
    RETURN file_id;
END;
$$ LANGUAGE plpgsql;
