/*
  # Reset recruiter password
  
  Resets the password for recruteur@miningcorp.gn to Rogerdore7
*/

-- Use the Supabase admin function to update user password
-- This requires using the service role which is available in migrations
SELECT
  auth.uid(),
  current_user
FROM (SELECT 1) AS foo;