-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create clubs table
CREATE TABLE IF NOT EXISTS public.clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  bpm INTEGER,
  key TEXT,
  mode TEXT CHECK (mode IN ('private', 'public', 'remixable')) DEFAULT 'private',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  parent_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  mixdown_url TEXT,
  waveform_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_tags table
CREATE TABLE IF NOT EXISTS public.project_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stems table
CREATE TABLE IF NOT EXISTS public.stems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  waveform_data JSONB,
  color TEXT DEFAULT '#3b82f6',
  duration FLOAT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stem_settings table (for mixer controls)
CREATE TABLE IF NOT EXISTS public.stem_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stem_id UUID REFERENCES public.stems(id) ON DELETE CASCADE NOT NULL,
  version_id UUID,
  volume FLOAT DEFAULT 1.0 CHECK (volume >= 0 AND volume <= 2),
  pan FLOAT DEFAULT 0 CHECK (pan >= -1 AND pan <= 1),
  muted BOOLEAN DEFAULT FALSE,
  solo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create versions table
CREATE TABLE IF NOT EXISTS public.versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL,
  notes TEXT,
  mixdown_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  stem_id UUID REFERENCES public.stems(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  timestamp FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collaborators table
CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'collaborator', 'viewer')) DEFAULT 'collaborator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create club_members table
CREATE TABLE IF NOT EXISTS public.club_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'moderator', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create challenge_submissions table
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, project_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_club ON public.projects(club_id);
CREATE INDEX IF NOT EXISTS idx_projects_mode ON public.projects(mode);
CREATE INDEX IF NOT EXISTS idx_stems_project ON public.stems(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_project ON public.comments(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_stem ON public.comments(stem_id);
CREATE INDEX IF NOT EXISTS idx_versions_project ON public.versions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tags_project ON public.project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_project ON public.collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON public.club_members(club_id);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Public projects are viewable by everyone" ON public.projects
  FOR SELECT USING (mode IN ('public', 'remixable') OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.collaborators WHERE project_id = id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.collaborators WHERE project_id = id AND user_id = auth.uid() AND role IN ('owner', 'collaborator')
  ));

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (owner_id = auth.uid());

-- Stems policies
CREATE POLICY "Stems viewable if project is viewable" ON public.stems
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND (
      mode IN ('public', 'remixable') OR owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.collaborators WHERE project_id = projects.id AND user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Collaborators can insert stems" ON public.stems
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND (
      owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'collaborator')
      )
    )
  ));

CREATE POLICY "Collaborators can update stems" ON public.stems
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND (
      owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.collaborators WHERE project_id = projects.id AND user_id = auth.uid() AND role IN ('owner', 'collaborator')
      )
    )
  ));

-- Comments policies
CREATE POLICY "Comments viewable if project is viewable" ON public.comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND (
      mode IN ('public', 'remixable') OR owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.collaborators WHERE project_id = projects.id AND user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Authenticated users can create comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
