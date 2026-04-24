-- SkillLens Storage Configuration Migration
-- Migration: 003_storage.sql

-- ============================================================
-- Create private 'cvs' bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false);

-- ============================================================
-- Storage RLS policies for the 'cvs' bucket
-- Path format: {userId}/{cvId}/{fileName}
-- Users may only read/write objects under their own userId prefix
-- (storage.foldername(name))[1] returns the first path segment
-- ============================================================

-- SELECT: users can read their own files
CREATE POLICY cvs_select ON storage.objects
    FOR SELECT USING (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = (
            SELECT user_id::text FROM users WHERE auth_id = auth.uid()
        )
    );

-- INSERT: users can upload files under their own prefix
CREATE POLICY cvs_insert ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = (
            SELECT user_id::text FROM users WHERE auth_id = auth.uid()
        )
    );

-- UPDATE: users can update their own files
CREATE POLICY cvs_update ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = (
            SELECT user_id::text FROM users WHERE auth_id = auth.uid()
        )
    )
    WITH CHECK (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = (
            SELECT user_id::text FROM users WHERE auth_id = auth.uid()
        )
    );

-- DELETE: users can delete their own files
CREATE POLICY cvs_delete ON storage.objects
    FOR DELETE USING (
        bucket_id = 'cvs'
        AND (storage.foldername(name))[1] = (
            SELECT user_id::text FROM users WHERE auth_id = auth.uid()
        )
    );
