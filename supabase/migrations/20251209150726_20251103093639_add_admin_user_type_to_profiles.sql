/*
  # Add Admin User Type to Profiles

  ## 1. Changes
    - Modify profiles table to accept 'admin' as user_type
    - Update check constraint to include admin type

  ## 2. Security
    - Maintains existing RLS policies
    - Admin type required for CMS access
*/

-- Drop existing constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Add new constraint with admin type
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('candidate', 'recruiter', 'admin'));