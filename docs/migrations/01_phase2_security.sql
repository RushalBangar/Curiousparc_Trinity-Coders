-- ============================================================================
-- Phase 2: Supabase Security & Database Integrity
-- Execute this file in your Supabase SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Unified Taxonomy Constraints (Postgres Trigger)
-- Auto-lowercase and trim skill names to prevent duplicates like 'React' and 'react '
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sanitize_skill_name()
RETURNS trigger AS $$
BEGIN
  -- Trim whitespace and convert to lowercase
  NEW.name := lower(trim(NEW.name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sanitize_skill_name ON skills;
CREATE TRIGGER trg_sanitize_skill_name
BEFORE INSERT OR UPDATE ON skills
FOR EACH ROW
EXECUTE FUNCTION sanitize_skill_name();


-- ----------------------------------------------------------------------------
-- 2. Row Level Security (RLS) Policies
-- Ensure strict data isolation between candidates and recruiters
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 
-- Profiles
-- 
-- Anyone authenticated can read profiles (needed for recruiters to see applicants, etc.)
CREATE POLICY "Profiles are viewable by authenticated users" 
ON profiles FOR SELECT TO authenticated USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 
-- Skills (Taxonomy)
-- 
-- Anyone can read skills
CREATE POLICY "Skills are viewable by everyone" 
ON skills FOR SELECT TO authenticated USING (true);

-- Only authenticated users can insert new skills (or restrict to admin if preferred)
CREATE POLICY "Authenticated users can insert skills" 
ON skills FOR INSERT TO authenticated WITH CHECK (true);

-- 
-- Candidate Skills
-- 
-- Anyone can read candidate skills
CREATE POLICY "Candidate skills are viewable by everyone" 
ON candidate_skills FOR SELECT TO authenticated USING (true);

-- Candidates can only manage their own skills
CREATE POLICY "Candidates can manage own skills" 
ON candidate_skills FOR ALL TO authenticated 
USING (auth.uid() = candidate_id)
WITH CHECK (auth.uid() = candidate_id);

-- 
-- Jobs
-- 
-- Anyone can read active jobs or any job
CREATE POLICY "Jobs are viewable by everyone" 
ON jobs FOR SELECT TO authenticated USING (true);

-- Recruiters can only insert/update their own jobs
CREATE POLICY "Recruiters can insert own jobs" 
ON jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update own jobs" 
ON jobs FOR UPDATE TO authenticated USING (auth.uid() = recruiter_id);

-- 
-- Job Skills
-- 
-- Anyone can read job skills
CREATE POLICY "Job skills are viewable by everyone" 
ON job_skills FOR SELECT TO authenticated USING (true);

-- Recruiters can insert job skills if they own the job
CREATE POLICY "Recruiters can insert job skills for own jobs" 
ON job_skills FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.recruiter_id = auth.uid()
  )
);

-- 
-- Applications
-- 
-- Candidates can read their own applications
CREATE POLICY "Candidates can read own applications" 
ON applications FOR SELECT TO authenticated 
USING (auth.uid() = candidate_id);

-- Recruiters can read applications for their own jobs
CREATE POLICY "Recruiters can read applications for their jobs" 
ON applications FOR SELECT TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.recruiter_id = auth.uid()
  )
);

-- Candidates can insert their own applications
CREATE POLICY "Candidates can insert own applications" 
ON applications FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = candidate_id);

-- Recruiters can update applications (e.g. status) for their own jobs
CREATE POLICY "Recruiters can update applications for their jobs" 
ON applications FOR UPDATE TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.recruiter_id = auth.uid()
  )
);
