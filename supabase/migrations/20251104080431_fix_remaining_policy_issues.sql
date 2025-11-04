/*
  # Fix Remaining Policy and Index Issues

  ## Changes Made

  ### 1. Consolidate Profile Cart Policies
  Removes duplicate policies and creates single comprehensive policies
  that handle both authenticated and anonymous users efficiently.

  ### 2. All policies now use (SELECT auth.uid()) for optimal performance
*/

-- =====================================================
-- FIX PROFILE_CART POLICIES
-- =====================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view cart items" ON public.profile_cart;
DROP POLICY IF EXISTS "Users can add to cart" ON public.profile_cart;
DROP POLICY IF EXISTS "Users can remove from cart" ON public.profile_cart;
DROP POLICY IF EXISTS "Anonymous users can view own cart by session" ON public.profile_cart;
DROP POLICY IF EXISTS "Anonymous users can add to cart by session" ON public.profile_cart;
DROP POLICY IF EXISTS "Anonymous users can remove from cart by session" ON public.profile_cart;

-- Create single comprehensive policies
CREATE POLICY "View cart items"
  ON public.profile_cart
  FOR SELECT
  USING (
    (user_id = (SELECT auth.uid())) OR 
    (session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "Add to cart"
  ON public.profile_cart
  FOR INSERT
  WITH CHECK (
    (user_id = (SELECT auth.uid())) OR 
    (session_id IS NOT NULL AND user_id IS NULL)
  );

CREATE POLICY "Remove from cart"
  ON public.profile_cart
  FOR DELETE
  USING (
    (user_id = (SELECT auth.uid())) OR 
    (session_id IS NOT NULL AND user_id IS NULL)
  );