/*
  # Fix Jobs Status Constraint Syntax

  1. Problem
    - The CHECK constraint on jobs.status uses ANY(ARRAY[...]) syntax
    - This can cause issues with "op ANY/ALL (array) requires operator to yield boolean"
    - The error appears when RLS policies are evaluated during UPDATE operations
  
  2. Solution
    - Drop the existing CHECK constraint
    - Create a new one with cleaner IN (...) syntax
    - This is more compatible with RLS policy evaluation
  
  3. Security
    - Same validation: status must be 'draft', 'published', or 'closed'
    - No change in behavior, just cleaner syntax
*/

-- Drop the problematic constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Recreate with cleaner syntax using IN instead of ANY(ARRAY[...])
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
  CHECK (status IN ('draft', 'published', 'closed'));