-- Stocke les sections de retakes sélectionnées pour comping
CREATE TABLE IF NOT EXISTS project_comped_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES project_tracks(id) ON DELETE CASCADE,
  take_id UUID NOT NULL REFERENCES project_takes(id) ON DELETE CASCADE,
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX idx_comped_sections_track ON project_comped_sections(track_id);
CREATE INDEX idx_comped_sections_take ON project_comped_sections(take_id);

-- RLS Policies
ALTER TABLE project_comped_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can view comped sections
CREATE POLICY "Anyone can view comped sections"
  ON project_comped_sections FOR SELECT
  USING (true);

-- Project members can create/update/delete sections
CREATE POLICY "Project members can manage comped sections"
  ON project_comped_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_tracks pt
      JOIN projects p ON p.id = pt.project_id
      JOIN project_members pm ON pm.project_id = p.id
      WHERE pt.id = project_comped_sections.track_id
        AND pm.user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_comped_sections_updated_at
  BEFORE UPDATE ON project_comped_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
