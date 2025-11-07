/*
  # Create Storage for Candidate Profile Files

  ## Overview
  Creates storage buckets and policies for candidate profile files including:
  - Profile photos
  - CVs (resumes)
  - Certificates

  ## Storage Buckets
  - `candidate-profiles` - For profile photos, CVs, and certificates

  ## Security
  - Authenticated users can upload their own files
  - Authenticated users can update their own files
  - Authenticated users can delete their own files
  - Files are organized by user_id: {user_id}/photo.jpg, {user_id}/cv.pdf, etc.
  - Premium recruiters can view candidate files (based on profile purchases)
*/

-- Create storage bucket for candidate profile files
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-profiles', 'candidate-profiles', false)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own profile files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own profile files" ON storage.objects;
DROP POLICY IF EXISTS "Recruiters can view purchased candidate files" ON storage.objects;
DROP POLICY IF EXISTS "Gold members files more visible" ON storage.objects;

-- Policy: Users can upload their own profile files
CREATE POLICY "Users can upload own profile files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own profile files
CREATE POLICY "Users can update own profile files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'candidate-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own profile files
CREATE POLICY "Users can delete own profile files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own profile files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-profiles' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Premium recruiters can view files of candidates they purchased
CREATE POLICY "Recruiters can view purchased candidate files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-profiles'
  AND EXISTS (
    SELECT 1 FROM profile_purchases pp
    JOIN candidate_profiles cp ON pp.candidate_id = cp.user_id
    WHERE pp.buyer_id = auth.uid()
      AND cp.user_id::text = (storage.foldername(name))[1]
      AND pp.payment_status = 'completed'
  )
);

-- Policy: Public candidate profiles can be viewed (for public visibility)
CREATE POLICY "Public candidate files visible"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-profiles'
  AND EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.user_id::text = (storage.foldername(name))[1]
      AND cp.visibility = 'public'
  )
);
