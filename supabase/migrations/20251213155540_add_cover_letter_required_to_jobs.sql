/*
  # Add cover letter requirement to jobs

  1. Changes
    - Add `cover_letter_required` boolean column to `jobs` table
    - Default to false for backward compatibility
    
  2. Purpose
    - Allow recruiters to specify if a cover letter is mandatory for applications
*/

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS cover_letter_required boolean DEFAULT false;

COMMENT ON COLUMN jobs.cover_letter_required IS 'Indicates if a cover letter is required for this job application';
