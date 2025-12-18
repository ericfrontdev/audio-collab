-- Drop old clubs structure if exists
DROP TABLE IF EXISTS club_thread_replies CASCADE;
DROP TABLE IF EXISTS club_threads CASCADE;
DROP TABLE IF EXISTS club_challenge_entries CASCADE;
DROP TABLE IF EXISTS club_challenges CASCADE;
DROP TABLE IF EXISTS club_projects CASCADE;
DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS club_requests CASCADE;
DROP TABLE IF EXISTS club_request_votes CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;

DROP FUNCTION IF EXISTS add_owner_as_member() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS get_club_member_count(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_club_request_vote_count(UUID) CASCADE;

-- Create clubs table
CREATE TABLE clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  genre TEXT NOT NULL,
  avatar_url TEXT,
  banner_url TEXT,
  rules TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create club_members table (join table)
CREATE TABLE club_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Create club_requests table (for users to request new clubs)
CREATE TABLE club_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_genre TEXT NOT NULL,
  description TEXT,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create club_request_votes table (users can upvote requests)
CREATE TABLE club_request_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES club_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_request_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clubs
CREATE POLICY "Clubs are viewable by everyone"
  ON clubs FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (false); -- Will be done via admin panel/SQL directly

CREATE POLICY "Only admins can update clubs"
  ON clubs FOR UPDATE
  USING (false); -- Admin only

CREATE POLICY "Only admins can delete clubs"
  ON clubs FOR DELETE
  USING (false); -- Admin only

-- RLS Policies for club_members
CREATE POLICY "Club members are viewable by everyone"
  ON club_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join clubs"
  ON club_members FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can leave clubs they joined"
  ON club_members FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- RLS Policies for club_requests
CREATE POLICY "Club requests are viewable by everyone"
  ON club_requests FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create club requests"
  ON club_requests FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = requested_by);

CREATE POLICY "Users can update their own requests"
  ON club_requests FOR UPDATE
  USING ((SELECT auth.uid()) = requested_by);

-- RLS Policies for club_request_votes
CREATE POLICY "Club request votes are viewable by everyone"
  ON club_request_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on requests"
  ON club_request_votes FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can remove their votes"
  ON club_request_votes FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- Indexes for performance
CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_genre ON clubs(genre);
CREATE INDEX idx_club_members_club_id ON club_members(club_id);
CREATE INDEX idx_club_members_user_id ON club_members(user_id);
CREATE INDEX idx_club_requests_status ON club_requests(status);
CREATE INDEX idx_club_request_votes_request_id ON club_request_votes(request_id);

-- Function to count club members
CREATE OR REPLACE FUNCTION get_club_member_count(club_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM club_members
  WHERE club_id = club_uuid;
$$;

-- Function to count votes on a club request
CREATE OR REPLACE FUNCTION get_club_request_vote_count(request_uuid UUID)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM club_request_votes
  WHERE request_id = request_uuid;
$$;

-- Auto-update trigger for clubs
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update trigger for club_requests
CREATE TRIGGER update_club_requests_updated_at
  BEFORE UPDATE ON club_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial clubs (popular genres)
INSERT INTO clubs (name, slug, description, genre, created_by) VALUES
  ('Lo-fi', 'lofi', 'Chill beats and relaxing vibes', 'Lo-fi', NULL),
  ('Hip-Hop', 'hiphop', 'Rap, beats, and urban music', 'Hip-Hop', NULL),
  ('Jazz', 'jazz', 'Improvisation and smooth melodies', 'Jazz', NULL),
  ('Rock', 'rock', 'Guitar-driven anthems and energy', 'Rock', NULL),
  ('Electronic', 'electronic', 'Synths, EDM, and digital sounds', 'Electronic', NULL),
  ('Pop', 'pop', 'Catchy melodies and mainstream hits', 'Pop', NULL),
  ('R&B', 'rnb', 'Rhythm and blues with soul', 'R&B', NULL),
  ('Indie', 'indie', 'Independent and alternative sounds', 'Indie', NULL),
  ('Metal', 'metal', 'Heavy riffs and intense energy', 'Metal', NULL),
  ('Country', 'country', 'Storytelling and acoustic vibes', 'Country', NULL),
  ('Classical', 'classical', 'Orchestral and timeless compositions', 'Classical', NULL),
  ('Ambient', 'ambient', 'Atmospheric and experimental sounds', 'Ambient', NULL);
