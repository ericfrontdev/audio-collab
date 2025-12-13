-- Add kind field to projects table to separate personal, club, and challenge projects
-- Also add club_id and challenge_id references

-- Add kind column
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'personal' CHECK (kind IN ('personal', 'club', 'challenge'));

-- Add challenge_id column (club_id already exists from previous migration)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS challenge_id UUID REFERENCES club_challenges(id) ON DELETE CASCADE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_kind ON projects(kind);
CREATE INDEX IF NOT EXISTS idx_projects_club_id ON projects(club_id);
CREATE INDEX IF NOT EXISTS idx_projects_challenge_id ON projects(challenge_id);

-- Add check constraints to ensure data integrity
ALTER TABLE projects
  ADD CONSTRAINT check_club_project_has_club_id
    CHECK (kind != 'club' OR club_id IS NOT NULL);

ALTER TABLE projects
  ADD CONSTRAINT check_challenge_project_has_challenge_id
    CHECK (kind != 'challenge' OR challenge_id IS NOT NULL);

ALTER TABLE projects
  ADD CONSTRAINT check_personal_project_no_club_or_challenge
    CHECK (kind != 'personal' OR (club_id IS NULL AND challenge_id IS NULL));

-- Update existing projects to set club_id from club_projects table
UPDATE projects
SET
  kind = 'club',
  club_id = (
    SELECT club_id
    FROM club_projects
    WHERE club_projects.project_id = projects.id
    LIMIT 1
  )
WHERE id IN (SELECT project_id FROM club_projects);

-- Now we can drop the club_projects table since we have the info in projects directly
-- But we'll keep it for now in case we need it for migration rollback
-- DROP TABLE IF EXISTS club_projects CASCADE;

-- Comments
COMMENT ON COLUMN projects.kind IS 'Type of project: personal (user studio), club (collaboration), or challenge (competition entry)';
COMMENT ON COLUMN projects.club_id IS 'Club this project belongs to (for club and challenge projects)';
COMMENT ON COLUMN projects.challenge_id IS 'Challenge this project is participating in (for challenge projects only)';
