-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- ============================================
-- Enable RLS on all tables
-- ============================================

ALTER TABLE file_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE merges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: Check if user has access to project
-- ============================================

CREATE OR REPLACE FUNCTION user_has_project_access(project_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user is owner or member of project
    RETURN EXISTS (
        SELECT 1 FROM projects p
        WHERE p.id = project_uuid
        AND (
            p.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = project_uuid
                AND pm.user_id = auth.uid()
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FILE_STORAGE policies
-- ============================================

-- Users can view files if they have access to any commit using that file
CREATE POLICY "Users can view files from their projects"
ON file_storage FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM stems s
        JOIN commits c ON s.commit_id = c.id
        JOIN repositories r ON c.repository_id = r.id
        WHERE (s.audio_file_id = file_storage.id OR s.midi_file_id = file_storage.id)
        AND user_has_project_access(r.project_id)
    )
);

-- Users can upload files (will be validated via stems insertion)
CREATE POLICY "Users can upload files"
ON file_storage FOR INSERT
WITH CHECK (uploaded_by = auth.uid());

-- No direct updates or deletes (managed by reference counting)
CREATE POLICY "No direct file updates"
ON file_storage FOR UPDATE
USING (false);

CREATE POLICY "No direct file deletes"
ON file_storage FOR DELETE
USING (false);

-- ============================================
-- REPOSITORIES policies
-- ============================================

CREATE POLICY "Users can view repos of their projects"
ON repositories FOR SELECT
USING (user_has_project_access(project_id));

CREATE POLICY "Users can create repos for their projects"
ON repositories FOR INSERT
WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "Users can update repos of their projects"
ON repositories FOR UPDATE
USING (user_has_project_access(project_id))
WITH CHECK (user_has_project_access(project_id));

CREATE POLICY "Users can delete repos of their projects"
ON repositories FOR DELETE
USING (user_has_project_access(project_id));

-- ============================================
-- BRANCHES policies
-- ============================================

CREATE POLICY "Users can view branches of their repos"
ON branches FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = branches.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can create branches"
ON branches FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = branches.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can update branches"
ON branches FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = branches.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can delete their own branches"
ON branches FOR DELETE
USING (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = branches.repository_id
        AND user_has_project_access(r.project_id)
    )
);

-- ============================================
-- COMMITS policies
-- ============================================

CREATE POLICY "Users can view commits from their repos"
ON commits FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = commits.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can create commits"
ON commits FOR INSERT
WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = commits.repository_id
        AND user_has_project_access(r.project_id)
    )
);

-- Commits are immutable (no updates/deletes)
CREATE POLICY "No commit updates"
ON commits FOR UPDATE
USING (false);

CREATE POLICY "Only authors can delete their commits"
ON commits FOR DELETE
USING (
    author_id = auth.uid()
    AND created_at > NOW() - INTERVAL '5 minutes' -- Only recent commits
);

-- ============================================
-- STEMS policies
-- ============================================

CREATE POLICY "Users can view stems from their commits"
ON stems FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM commits c
        JOIN repositories r ON c.repository_id = r.id
        WHERE c.id = stems.commit_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can add stems to their commits"
ON stems FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM commits c
        JOIN repositories r ON c.repository_id = r.id
        WHERE c.id = stems.commit_id
        AND c.author_id = auth.uid()
        AND user_has_project_access(r.project_id)
    )
);

-- Stems are immutable
CREATE POLICY "No stem updates"
ON stems FOR UPDATE
USING (false);

CREATE POLICY "No stem deletes"
ON stems FOR DELETE
USING (false);

-- ============================================
-- TAGS policies
-- ============================================

CREATE POLICY "Users can view tags from their repos"
ON tags FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = tags.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can create tags"
ON tags FOR INSERT
WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = tags.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can delete their own tags"
ON tags FOR DELETE
USING (
    created_by = auth.uid()
);

-- ============================================
-- MERGES policies
-- ============================================

CREATE POLICY "Users can view merges from their repos"
ON merges FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = merges.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can create merges"
ON merges FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = merges.repository_id
        AND user_has_project_access(r.project_id)
    )
);

CREATE POLICY "Users can update their merges"
ON merges FOR UPDATE
USING (
    merged_by = auth.uid()
    OR EXISTS (
        SELECT 1 FROM repositories r
        WHERE r.id = merges.repository_id
        AND user_has_project_access(r.project_id)
    )
);

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-commits', 'audio-commits', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to their projects"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'audio-commits'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can read files from their projects"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'audio-commits'
    AND auth.uid() IS NOT NULL
);

CREATE POLICY "No direct storage updates"
ON storage.objects FOR UPDATE
USING (false);

CREATE POLICY "Users can delete their own recent uploads"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'audio-commits'
    AND owner = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour'
);
