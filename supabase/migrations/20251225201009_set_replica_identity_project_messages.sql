-- Set REPLICA IDENTITY FULL so Realtime can properly broadcast with RLS
ALTER TABLE project_messages REPLICA IDENTITY FULL;
