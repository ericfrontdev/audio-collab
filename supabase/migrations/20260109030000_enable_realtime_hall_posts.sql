-- Enable realtime for project_hall_posts table
-- This allows clients to subscribe to INSERT, UPDATE, DELETE events

ALTER PUBLICATION supabase_realtime ADD TABLE project_hall_posts;

-- Set replica identity to FULL to include all column values in realtime events
ALTER TABLE project_hall_posts REPLICA IDENTITY FULL;
