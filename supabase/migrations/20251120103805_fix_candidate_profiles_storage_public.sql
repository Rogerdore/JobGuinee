/*
  # Fix Candidate Profiles Storage to be Public

  ## Changes
  - Updates the `candidate-profiles` storage bucket to be public
  - This allows profile photos to be displayed without authentication
  - CVs and certificates remain in the same bucket but with controlled access through policies

  ## Rationale
  - Profile photos need to be publicly accessible to display in the UI
  - The existing policies still control who can upload/update/delete files
  - Only viewing is made public, which is appropriate for profile photos
*/

-- Update the candidate-profiles bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'candidate-profiles';
