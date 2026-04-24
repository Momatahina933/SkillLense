-- SkillLens RLS Policies Migration
-- Migration: 002_rls_policies.sql

-- ============================================================
-- Enable Row Level Security on all tables
-- ============================================================
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE cv_uploads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_skills    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_required_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gap_results   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback            ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- users
-- Keyed by auth_id (Supabase Auth uid)
-- ============================================================
CREATE POLICY users_select ON users
    FOR SELECT USING (auth_id = auth.uid());

CREATE POLICY users_insert ON users
    FOR INSERT WITH CHECK (auth_id = auth.uid());

CREATE POLICY users_update ON users
    FOR UPDATE USING (auth_id = auth.uid())
    WITH CHECK (auth_id = auth.uid());

CREATE POLICY users_delete ON users
    FOR DELETE USING (auth_id = auth.uid());

-- ============================================================
-- profiles
-- Joined to users via user_id; users.auth_id must match auth.uid()
-- ============================================================
CREATE POLICY profiles_select ON profiles
    FOR SELECT USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY profiles_insert ON profiles
    FOR INSERT WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY profiles_update ON profiles
    FOR UPDATE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY profiles_delete ON profiles
    FOR DELETE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

-- ============================================================
-- cv_uploads  (direct user_id column)
-- ============================================================
CREATE POLICY cv_uploads_select ON cv_uploads
    FOR SELECT USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY cv_uploads_insert ON cv_uploads
    FOR INSERT WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY cv_uploads_update ON cv_uploads
    FOR UPDATE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY cv_uploads_delete ON cv_uploads
    FOR DELETE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

-- ============================================================
-- extracted_skills  (child of cv_uploads — join to check ownership)
-- ============================================================
CREATE POLICY extracted_skills_select ON extracted_skills
    FOR SELECT USING (
        cv_id IN (
            SELECT cv_id FROM cv_uploads
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY extracted_skills_insert ON extracted_skills
    FOR INSERT WITH CHECK (
        cv_id IN (
            SELECT cv_id FROM cv_uploads
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY extracted_skills_update ON extracted_skills
    FOR UPDATE USING (
        cv_id IN (
            SELECT cv_id FROM cv_uploads
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    )
    WITH CHECK (
        cv_id IN (
            SELECT cv_id FROM cv_uploads
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY extracted_skills_delete ON extracted_skills
    FOR DELETE USING (
        cv_id IN (
            SELECT cv_id FROM cv_uploads
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

-- ============================================================
-- job_descriptions  (direct user_id column)
-- ============================================================
CREATE POLICY job_descriptions_select ON job_descriptions
    FOR SELECT USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY job_descriptions_insert ON job_descriptions
    FOR INSERT WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY job_descriptions_update ON job_descriptions
    FOR UPDATE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY job_descriptions_delete ON job_descriptions
    FOR DELETE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

-- ============================================================
-- job_required_skills  (child of job_descriptions — join to check ownership)
-- ============================================================
CREATE POLICY job_required_skills_select ON job_required_skills
    FOR SELECT USING (
        job_id IN (
            SELECT job_id FROM job_descriptions
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY job_required_skills_insert ON job_required_skills
    FOR INSERT WITH CHECK (
        job_id IN (
            SELECT job_id FROM job_descriptions
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY job_required_skills_update ON job_required_skills
    FOR UPDATE USING (
        job_id IN (
            SELECT job_id FROM job_descriptions
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    )
    WITH CHECK (
        job_id IN (
            SELECT job_id FROM job_descriptions
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY job_required_skills_delete ON job_required_skills
    FOR DELETE USING (
        job_id IN (
            SELECT job_id FROM job_descriptions
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

-- ============================================================
-- match_results  (direct user_id column)
-- ============================================================
CREATE POLICY match_results_select ON match_results
    FOR SELECT USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY match_results_insert ON match_results
    FOR INSERT WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY match_results_update ON match_results
    FOR UPDATE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY match_results_delete ON match_results
    FOR DELETE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

-- ============================================================
-- skill_gap_results  (child of match_results — join to check ownership)
-- ============================================================
CREATE POLICY skill_gap_results_select ON skill_gap_results
    FOR SELECT USING (
        match_id IN (
            SELECT match_id FROM match_results
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY skill_gap_results_insert ON skill_gap_results
    FOR INSERT WITH CHECK (
        match_id IN (
            SELECT match_id FROM match_results
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY skill_gap_results_update ON skill_gap_results
    FOR UPDATE USING (
        match_id IN (
            SELECT match_id FROM match_results
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    )
    WITH CHECK (
        match_id IN (
            SELECT match_id FROM match_results
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

CREATE POLICY skill_gap_results_delete ON skill_gap_results
    FOR DELETE USING (
        match_id IN (
            SELECT match_id FROM match_results
            WHERE user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
        )
    );

-- ============================================================
-- feedback  (direct user_id column)
-- ============================================================
CREATE POLICY feedback_select ON feedback
    FOR SELECT USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY feedback_insert ON feedback
    FOR INSERT WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY feedback_update ON feedback
    FOR UPDATE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
    WITH CHECK (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY feedback_delete ON feedback
    FOR DELETE USING (
        user_id IN (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

-- ============================================================
-- Enforce one feedback per match per user (Property 10)
-- ============================================================
ALTER TABLE feedback
    ADD CONSTRAINT uq_feedback_match_user UNIQUE (match_id, user_id);
