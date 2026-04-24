-- SkillLens Initial Schema Migration
-- Migration: 001_initial_schema.sql

-- Users (mirrors Supabase Auth uid)
CREATE TABLE users (
    user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id     UUID UNIQUE NOT NULL,   -- Supabase Auth user.id
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Profiles
CREATE TABLE profiles (
    profile_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    education_summary   TEXT,
    experience_summary  TEXT,
    target_role         TEXT,
    career_goal         TEXT,
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- CV Uploads
CREATE TABLE cv_uploads (
    cv_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    file_path       TEXT NOT NULL,      -- Supabase Storage path
    upload_date     TIMESTAMPTZ DEFAULT now(),
    parse_status    TEXT DEFAULT 'pending' CHECK (parse_status IN ('pending','processing','completed','failed')),
    error_message   TEXT
);

-- Extracted Skills
CREATE TABLE extracted_skills (
    skill_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cv_id               UUID REFERENCES cv_uploads(cv_id) ON DELETE CASCADE,
    raw_skill_text      TEXT NOT NULL,
    normalised_name     TEXT NOT NULL,
    confidence_score    NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
    user_verified       BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- Job Descriptions
CREATE TABLE job_descriptions (
    job_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    company_name    TEXT,
    description_text TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Job Required Skills
CREATE TABLE job_required_skills (
    job_skill_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID REFERENCES job_descriptions(job_id) ON DELETE CASCADE,
    skill_name      TEXT NOT NULL,
    importance_weight SMALLINT DEFAULT 3 CHECK (importance_weight BETWEEN 1 AND 5)
);

-- Match Results
CREATE TABLE match_results (
    match_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(user_id) ON DELETE CASCADE,
    cv_id       UUID REFERENCES cv_uploads(cv_id),
    job_id      UUID REFERENCES job_descriptions(job_id),
    match_score NUMERIC(5,2) CHECK (match_score BETWEEN 0 AND 100),
    explanation TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

-- Skill Gap Results
CREATE TABLE skill_gap_results (
    gap_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id            UUID REFERENCES match_results(match_id) ON DELETE CASCADE,
    skill_name          TEXT NOT NULL,
    gap_type            TEXT CHECK (gap_type IN ('matched','partial','missing')),
    similarity_score    NUMERIC(4,3),
    recommendation_note TEXT
);

-- Feedback
CREATE TABLE feedback (
    feedback_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id        UUID REFERENCES match_results(match_id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    usability_rating SMALLINT CHECK (usability_rating BETWEEN 1 AND 5),
    comments        TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cv_uploads_user     ON cv_uploads(user_id);
CREATE INDEX idx_extracted_skills_cv ON extracted_skills(cv_id);
CREATE INDEX idx_job_desc_user       ON job_descriptions(user_id);
CREATE INDEX idx_match_results_user  ON match_results(user_id);
CREATE INDEX idx_match_results_cv    ON match_results(cv_id);
CREATE INDEX idx_skill_gap_match     ON skill_gap_results(match_id);
