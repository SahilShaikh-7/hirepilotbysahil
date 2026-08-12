
-- HIREPATH ATS COMPLETE DATABASE SCHEMA

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'interviewer', 'candidate');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('open', 'closed', 'draft');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('applied', 'shortlisted', 'interview_scheduled', 'selected', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interview_status AS ENUM ('scheduled', 'completed', 'cancelled', 'rescheduled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE interview_type AS ENUM ('phone_screen', 'technical', 'cultural', 'managerial', 'final');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'candidate',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT,
  description TEXT,
  skills TEXT[],
  experience_range TEXT,
  hiring_manager_id UUID REFERENCES public.profiles(id),
  status job_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  resume_url TEXT,
  linkedin_url TEXT,
  professional_role TEXT, 
  source TEXT DEFAULT 'Direct',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
  status application_status DEFAULT 'applied',
  current_stage_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, candidate_id)
);

CREATE TABLE IF NOT EXISTS public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES public.applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type interview_type DEFAULT 'technical',
  status interview_status DEFAULT 'scheduled',
  meeting_link TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interview_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id) ON DELETE CASCADE,
  interviewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE(interview_id, interviewer_id)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details TEXT,
  type TEXT DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.detect_interview_conflicts(
  p_interviewer_id UUID,
  p_start TIMESTAMPTZ,
  p_end TIMESTAMPTZ
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.interviews i
    JOIN public.interview_participants ip ON i.id = ip.interview_id
    WHERE ip.interviewer_id = p_interviewer_id
    AND i.status = 'scheduled'
    AND (
      (p_start >= i.start_time AND p_start < i.end_time) OR
      (p_end > i.start_time AND p_end <= i.end_time) OR
      (p_start <= i.start_time AND p_end >= i.end_time)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_recruiter()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'recruiter')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. TRIGGER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_first_user BOOLEAN;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles) INTO is_first_user;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'ATS User'), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://ui-avatars.com/api/?name=User'), 
    CASE 
      WHEN is_first_user THEN 'admin'::user_role
      WHEN new.email = 'sahil68shaikh68@gmail.com' THEN 'admin'::user_role
      ELSE 'recruiter'::user_role 
    END
  )
  ON CONFLICT (email) DO UPDATE 
  SET id = new.id;
      
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- CLEANUP OLD POLICIES
DROP POLICY IF EXISTS "Profiles managed by admins" ON public.profiles;
DROP POLICY IF EXISTS "Candidates managed by admins" ON public.candidates;
DROP POLICY IF EXISTS "Applications managed by admins" ON public.applications;
DROP POLICY IF EXISTS "Interviews managed by admins" ON public.interviews;

-- Profiles
CREATE POLICY "Profiles viewable by anyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles managed by admins" ON public.profiles FOR ALL USING (is_admin_or_recruiter()) WITH CHECK (is_admin_or_recruiter());
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Jobs
CREATE POLICY "Jobs viewable by anyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Jobs managed by admins" ON public.jobs FOR ALL USING (is_admin_or_recruiter()) WITH CHECK (is_admin_or_recruiter());

-- Candidates
CREATE POLICY "Candidates viewable by admins" ON public.candidates FOR SELECT USING (is_admin_or_recruiter());
CREATE POLICY "Candidates managed by admins" ON public.candidates FOR ALL USING (is_admin_or_recruiter()) WITH CHECK (is_admin_or_recruiter());

-- Applications
CREATE POLICY "Applications viewable by admins" ON public.applications FOR SELECT USING (is_admin_or_recruiter());
CREATE POLICY "Applications managed by admins" ON public.applications FOR ALL USING (is_admin_or_recruiter()) WITH CHECK (is_admin_or_recruiter());

-- Interviews
CREATE POLICY "Interviews viewable by anyone" ON public.interviews FOR SELECT USING (true);
CREATE POLICY "Interviews managed by admins" ON public.interviews FOR ALL USING (is_admin_or_recruiter()) WITH CHECK (is_admin_or_recruiter());

-- Participants
CREATE POLICY "Participants viewable by anyone" ON public.interview_participants FOR SELECT USING (true);
CREATE POLICY "Participants managed by admins" ON public.interview_participants FOR ALL USING (is_admin_or_recruiter()) WITH CHECK (is_admin_or_recruiter());

-- Activity Logs
CREATE POLICY "Logs viewable by recruiters" ON public.activity_logs FOR SELECT USING (is_admin_or_recruiter());
CREATE POLICY "Logs insertable by anyone authenticated" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
