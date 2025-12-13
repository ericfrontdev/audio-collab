-- =====================================================
-- MULTITRACK AUDIO SYSTEM
-- Stems, timeline comments, discussions, versions
-- =====================================================

-- 1. Update projects table with new fields
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS mixdown_url TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'finished', 'open_collab'));

CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- 2. PROJECT STEMS (multipiste)
CREATE TABLE IF NOT EXISTS project_stems (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  file_url TEXT NOT NULL,

  order_index INTEGER NOT NULL DEFAULT 0,

  -- Mix settings
  volume REAL NOT NULL DEFAULT 0.8,
  pan REAL NOT NULL DEFAULT 0.0 CHECK (pan >= -1.0 AND pan <= 1.0),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  is_solo BOOLEAN NOT NULL DEFAULT false,

  -- UI
  color TEXT,

  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stems_project ON project_stems(project_id);
CREATE INDEX IF NOT EXISTS idx_stems_order ON project_stems(project_id, order_index);

-- 3. TIMELINE COMMENTS (time-based on waveform)
CREATE TABLE IF NOT EXISTS project_timeline_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  time_seconds REAL NOT NULL CHECK (time_seconds >= 0),
  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_comments_project ON project_timeline_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_timeline_comments_time ON project_timeline_comments(project_id, time_seconds);

-- 4. DISCUSSION MESSAGES (general chat)
CREATE TABLE IF NOT EXISTS project_discussion_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discussion_project ON project_discussion_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_discussion_created ON project_discussion_messages(project_id, created_at DESC);

-- 5. COLLABORATORS
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  role TEXT NOT NULL DEFAULT 'collaborator' CHECK (role IN ('owner', 'collaborator')),
  instrument TEXT,

  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON project_collaborators(user_id);

-- 6. VERSIONS (snapshots)
CREATE TABLE IF NOT EXISTS project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  label TEXT NOT NULL,
  notes TEXT,
  mixdown_url TEXT,

  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versions_project ON project_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_created ON project_versions(project_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- PROJECT STEMS
ALTER TABLE project_stems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Stems visible based on project visibility"
  ON project_stems FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_stems.project_id
      AND (
        projects.mode = 'public'
        OR projects.mode = 'remixable'
        OR projects.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Project owner and collaborators can add stems"
  ON project_stems FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_stems.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Stem creator can update their stems"
  ON project_stems FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Stem creator can delete their stems"
  ON project_stems FOR DELETE
  USING (created_by = auth.uid());

-- TIMELINE COMMENTS
ALTER TABLE project_timeline_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timeline comments visible based on project visibility"
  ON project_timeline_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_timeline_comments.project_id
      AND (
        projects.mode = 'public'
        OR projects.mode = 'remixable'
        OR projects.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can comment on public/remixable projects"
  ON project_timeline_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_timeline_comments.project_id
      AND (projects.mode = 'public' OR projects.mode = 'remixable')
    )
    AND author_id = auth.uid()
  );

CREATE POLICY "Comment author can update their comments"
  ON project_timeline_comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Comment author can delete their comments"
  ON project_timeline_comments FOR DELETE
  USING (author_id = auth.uid());

-- DISCUSSION MESSAGES
ALTER TABLE project_discussion_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussion visible based on project visibility"
  ON project_discussion_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_discussion_messages.project_id
      AND (
        projects.mode = 'public'
        OR projects.mode = 'remixable'
        OR projects.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can discuss public/remixable projects"
  ON project_discussion_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_discussion_messages.project_id
      AND (projects.mode = 'public' OR projects.mode = 'remixable')
    )
    AND author_id = auth.uid()
  );

CREATE POLICY "Message author can update their messages"
  ON project_discussion_messages FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Message author can delete their messages"
  ON project_discussion_messages FOR DELETE
  USING (author_id = auth.uid());

-- COLLABORATORS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collaborators visible based on project visibility"
  ON project_collaborators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND (
        projects.mode = 'public'
        OR projects.mode = 'remixable'
        OR projects.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Project owner can add collaborators"
  ON project_collaborators FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owner can remove collaborators"
  ON project_collaborators FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_collaborators.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- VERSIONS
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Versions visible based on project visibility"
  ON project_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND (
        projects.mode = 'public'
        OR projects.mode = 'remixable'
        OR projects.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Project owner and collaborators can create versions"
  ON project_versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_versions.project_id
      AND (
        projects.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
    AND created_by = auth.uid()
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update updated_at for stems
CREATE TRIGGER stems_updated_at
  BEFORE UPDATE ON project_stems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update updated_at for timeline comments
CREATE TRIGGER timeline_comments_updated_at
  BEFORE UPDATE ON project_timeline_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update updated_at for discussion messages
CREATE TRIGGER discussion_messages_updated_at
  BEFORE UPDATE ON project_discussion_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-add project owner as collaborator with 'owner' role
CREATE OR REPLACE FUNCTION add_owner_as_collaborator()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_collaborators (project_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created_add_owner
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_collaborator();

-- Comments
COMMENT ON TABLE project_stems IS 'Individual audio tracks (stems) for multitrack projects';
COMMENT ON TABLE project_timeline_comments IS 'Time-based comments on the project waveform';
COMMENT ON TABLE project_discussion_messages IS 'General discussion messages for a project';
COMMENT ON TABLE project_collaborators IS 'Users collaborating on a project';
COMMENT ON TABLE project_versions IS 'Snapshots/versions of a project';
