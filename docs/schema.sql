-- Supabase PostgreSQL Schema for SkillBridge

-- 1. profiles: Stores user profile data linked directly to Supabase Auth.
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('seeker', 'recruiter', 'admin')) NOT NULL,
    bio TEXT,
    headline TEXT,
    location TEXT,
    resume_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. skills: Centralized standardized taxonomy of skills.
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL -- e.g., 'Languages', 'Frameworks', 'Databases', 'DevOps'
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- 3. candidate_skills: Association table for candidate proficiencies.
CREATE TABLE candidate_skills (
    candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level TEXT CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
    years_experience NUMERIC(3, 1),
    PRIMARY KEY (candidate_id, skill_id)
);

ALTER TABLE candidate_skills ENABLE ROW LEVEL SECURITY;

-- 4. jobs: Employer job postings.
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'internship', 'contract')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- 5. job_skills: Skill requirements defined for each job listing.
CREATE TABLE job_skills (
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT true, -- true for mandatory, false for preferred
    weight NUMERIC(3, 2) DEFAULT 1.00, -- importance multiplier (0.5 to 2.0)
    PRIMARY KEY (job_id, skill_id)
);

ALTER TABLE job_skills ENABLE ROW LEVEL SECURITY;

-- 6. applications: Job applications with computed match snapshot.
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    match_score NUMERIC(5, 2), -- recorded compatibility percentage
    status TEXT CHECK (status IN ('applied', 'reviewing', 'shortlisted', 'rejected')) DEFAULT 'applied',
    learning_commitment TEXT, -- plan to bridge gap
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (job_id, candidate_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
