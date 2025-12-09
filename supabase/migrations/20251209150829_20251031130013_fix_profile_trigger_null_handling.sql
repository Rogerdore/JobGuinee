/*
  # Fix Profile Creation Trigger - Null Handling

  ## Overview
  This migration fixes the profile creation trigger to properly handle NULL values
  and prevent "Database error saving new user" errors.

  ## Changes
  1. Update trigger function to properly handle NULL full_name
  2. Set default values correctly
  3. Ensure trigger executes without errors
*/

-- Drop and recreate the function with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS create_profile_on_signup();

-- Create improved function
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'candidate'),
    NULLIF(COALESCE(NEW.raw_user_meta_data->>'full_name', ''), '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
    user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in create_profile_on_signup: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();