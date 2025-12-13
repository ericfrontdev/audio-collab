-- =====================================================
-- CLUBS SYSTEM
-- Clubs as creative hubs, not just forums
-- =====================================================

-- 1. CLUBS TABLE
CREATE TABLE clubs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clubs_slug ON clubs(slug);
CREATE INDEX idx_clubs_owner ON clubs(owner_id);
CREATE INDEX idx_clubs_visibility ON clubs(visibility);

-- 2. CLUB MEMBERS
CREATE TABLE club_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

CREATE INDEX idx_club_members_club ON club_members(club_id);
CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_members_role ON club_members(role);

-- 3. CLUB PROJECTS (link existing projects to clubs)
CREATE TABLE club_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, project_id)
);

CREATE INDEX idx_club_projects_club ON club_projects(club_id);
CREATE INDEX idx_club_projects_project ON club_projects(project_id);

-- 4. CLUB CHALLENGES
CREATE TABLE club_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'finished')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_challenges_club ON club_challenges(club_id);
CREATE INDEX idx_club_challenges_status ON club_challenges(status);
CREATE INDEX idx_club_challenges_dates ON club_challenges(starts_at, ends_at);

-- 5. CLUB CHALLENGE ENTRIES
CREATE TABLE club_challenge_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES club_challenges(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, project_id)
);

CREATE INDEX idx_challenge_entries_challenge ON club_challenge_entries(challenge_id);
CREATE INDEX idx_challenge_entries_user ON club_challenge_entries(user_id);

-- 6. CLUB THREADS (Feed/Discussions)
CREATE TABLE club_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_club_threads_club ON club_threads(club_id);
CREATE INDEX idx_club_threads_created_at ON club_threads(created_at DESC);

-- 7. CLUB THREAD REPLIES
CREATE TABLE club_thread_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES club_threads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_thread_replies_thread ON club_thread_replies(thread_id);
CREATE INDEX idx_thread_replies_created_at ON club_thread_replies(created_at);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- CLUBS
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public clubs are viewable by everyone"
  ON clubs FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Private clubs are viewable by members"
  ON clubs FOR SELECT
  USING (
    visibility = 'private'
    AND EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = clubs.id
      AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create clubs"
  ON clubs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their clubs"
  ON clubs FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete their clubs"
  ON clubs FOR DELETE
  USING (owner_id = auth.uid());

-- CLUB MEMBERS
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club members are viewable by club members"
  ON club_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_members.club_id
      AND (
        clubs.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM club_members cm
          WHERE cm.club_id = clubs.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join public clubs"
  ON club_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_members.club_id
      AND clubs.visibility = 'public'
    )
  );

CREATE POLICY "Owners/admins can manage members"
  ON club_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members cm
      WHERE cm.club_id = club_members.club_id
      AND cm.user_id = auth.uid()
      AND cm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can leave clubs"
  ON club_members FOR DELETE
  USING (user_id = auth.uid());

-- CLUB PROJECTS
ALTER TABLE club_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club projects viewable by club members"
  ON club_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_projects.club_id
      AND (
        clubs.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = clubs.id
          AND club_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can add projects to clubs"
  ON club_projects FOR INSERT
  WITH CHECK (
    added_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_projects.club_id
      AND club_members.user_id = auth.uid()
    )
  );

-- CLUB CHALLENGES
ALTER TABLE club_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Club challenges viewable by club members"
  ON club_challenges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_challenges.club_id
      AND (
        clubs.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = clubs.id
          AND club_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Owners/admins can create challenges"
  ON club_challenges FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_challenges.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners/admins can update challenges"
  ON club_challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_challenges.club_id
      AND club_members.user_id = auth.uid()
      AND club_members.role IN ('owner', 'admin')
    )
  );

-- CLUB CHALLENGE ENTRIES
ALTER TABLE club_challenge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Challenge entries viewable by club members"
  ON club_challenge_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_challenges
      JOIN clubs ON clubs.id = club_challenges.club_id
      WHERE club_challenges.id = club_challenge_entries.challenge_id
      AND (
        clubs.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = clubs.id
          AND club_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can participate in challenges"
  ON club_challenge_entries FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_challenges
      JOIN club_members ON club_members.club_id = club_challenges.club_id
      WHERE club_challenges.id = club_challenge_entries.challenge_id
      AND club_members.user_id = auth.uid()
    )
  );

-- CLUB THREADS
ALTER TABLE club_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Threads viewable by club members"
  ON club_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs
      WHERE clubs.id = club_threads.club_id
      AND (
        clubs.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = clubs.id
          AND club_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create threads"
  ON club_threads FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_members
      WHERE club_members.club_id = club_threads.club_id
      AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Thread authors can update their threads"
  ON club_threads FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Thread authors can delete their threads"
  ON club_threads FOR DELETE
  USING (created_by = auth.uid());

-- CLUB THREAD REPLIES
ALTER TABLE club_thread_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Replies viewable by club members"
  ON club_thread_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_threads
      JOIN clubs ON clubs.id = club_threads.club_id
      WHERE club_threads.id = club_thread_replies.thread_id
      AND (
        clubs.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM club_members
          WHERE club_members.club_id = clubs.id
          AND club_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can reply to threads"
  ON club_thread_replies FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM club_threads
      JOIN club_members ON club_members.club_id = club_threads.club_id
      WHERE club_threads.id = club_thread_replies.thread_id
      AND club_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Reply authors can update their replies"
  ON club_thread_replies FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Reply authors can delete their replies"
  ON club_thread_replies FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-add owner as member when creating club
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO club_members (club_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_club_created
  AFTER INSERT ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION add_owner_as_member();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON club_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER threads_updated_at
  BEFORE UPDATE ON club_threads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER replies_updated_at
  BEFORE UPDATE ON club_thread_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE clubs IS 'Creative hubs organized by music style/genre';
COMMENT ON TABLE club_members IS 'Club membership and roles';
COMMENT ON TABLE club_projects IS 'Projects linked to clubs';
COMMENT ON TABLE club_challenges IS 'Musical challenges within clubs';
COMMENT ON TABLE club_challenge_entries IS 'User participation in challenges';
COMMENT ON TABLE club_threads IS 'Discussion threads in club feed';
COMMENT ON TABLE club_thread_replies IS 'Replies to discussion threads';
