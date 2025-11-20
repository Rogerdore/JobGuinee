/*
  # Add Public Access to Profile Photos

  ## Changes
  - Adds a policy to allow public (anonymous) access to profile photos
  - This enables profile photos to be displayed without authentication
  - Only applies to the candidate-profiles bucket

  ## Security
  - Read-only access for anonymous users
  - Upload/update/delete still require authentication
*/

-- Drop policy if it exists
DROP POLICY IF EXISTS "Anyone can view candidate profile files" ON storage.objects;

-- Allow anonymous users to view files in candidate-profiles bucket
CREATE POLICY "Anyone can view candidate profile files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidate-profiles');
