-- Add indexes and views for remix functionality
-- A remix is any project with parent_project_id IS NOT NULL
-- NOTE: This migration requires migration 007 to be run first (adds parent_project_id, cover_url, mixdown_url)

-- Add indexes for efficient remix queries
CREATE INDEX IF NOT EXISTS idx_projects_parent_id ON projects(parent_project_id) WHERE parent_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_club_remixes ON projects(club_id, parent_project_id) WHERE parent_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_challenge_remixes ON projects(challenge_id, parent_project_id) WHERE parent_project_id IS NOT NULL;

-- Create a view for easy remix queries with parent project info
CREATE OR REPLACE VIEW project_remixes AS
SELECT
  p.id,
  p.title,
  p.description,
  p.cover_url,
  p.mixdown_url,
  p.parent_project_id,
  p.owner_id,
  p.club_id,
  p.challenge_id,
  p.kind,
  p.mode,
  p.status,
  p.created_at,
  p.updated_at,
  -- Parent project info
  parent.title as parent_title,
  parent.owner_id as parent_owner_id,
  parent.club_id as parent_club_id,
  parent.challenge_id as parent_challenge_id,
  -- Creator info
  profiles.display_name as creator_name,
  profiles.avatar_url as creator_avatar,
  -- Parent creator info
  parent_creator.display_name as parent_creator_name,
  parent_creator.avatar_url as parent_creator_avatar,
  -- Club info (if applicable)
  clubs.name as club_name,
  clubs.slug as club_slug,
  -- Challenge info (if applicable)
  challenges.title as challenge_title
FROM projects p
INNER JOIN projects parent ON p.parent_project_id = parent.id
LEFT JOIN profiles ON p.owner_id = profiles.id
LEFT JOIN profiles parent_creator ON parent.owner_id = parent_creator.id
LEFT JOIN clubs ON p.club_id = clubs.id
LEFT JOIN club_challenges challenges ON p.challenge_id = challenges.id
WHERE p.parent_project_id IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON project_remixes TO authenticated, anon;

-- Add a helper function to count remixes for a project
CREATE OR REPLACE FUNCTION get_remix_count(project_id UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM projects
  WHERE parent_project_id = project_id;
$$;

-- Add a helper function to check if a user can remix a project
CREATE OR REPLACE FUNCTION can_remix_project(project_id UUID, user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
    AND (
      mode IN ('public', 'remixable')
      OR owner_id = user_id
      OR EXISTS (
        SELECT 1 FROM project_collaborators
        WHERE project_collaborators.project_id = projects.id
        AND project_collaborators.user_id = user_id
      )
    )
  );
$$;

-- Add comment explaining remix concept
COMMENT ON COLUMN projects.parent_project_id IS 'If not null, this project is a remix/fork of the parent project. All projects with parent_project_id are considered remixes.';
