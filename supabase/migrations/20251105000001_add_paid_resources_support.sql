/*
  # Add Paid Resources Support

  ## Description
  Adds support for both free and paid resources with pricing and author contact information

  ## Changes Made

  1. New Columns Added to `resources` table:
    - `is_paid` (boolean) - Indicates if resource is paid or free (default: false)
    - `price` (numeric) - Price of the resource in GNF (Guinean Franc)
    - `author_email` (text) - Contact email for the resource author
    - `author_phone` (text) - Contact phone for the resource author
    - `author_user_id` (uuid) - Link to the user who published the resource

  2. Security
    - Updated RLS policies to support author identification
    - Authors can manage their own resources

  ## Important Notes
  - Free resources have `is_paid = false` and `price = null`
  - Paid resources require contact with author for payment
  - Author contact info is only shown for paid resources
*/

-- Add new columns for paid resources
ALTER TABLE resources
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS price numeric(10, 2),
ADD COLUMN IF NOT EXISTS author_email text,
ADD COLUMN IF NOT EXISTS author_phone text,
ADD COLUMN IF NOT EXISTS author_user_id uuid REFERENCES auth.users(id);

-- Add check constraint: if is_paid is true, price must be set
ALTER TABLE resources
ADD CONSTRAINT check_paid_resource_has_price
CHECK (
  (is_paid = false) OR
  (is_paid = true AND price IS NOT NULL AND price > 0)
);

-- Add index for filtering by paid/free status
CREATE INDEX IF NOT EXISTS idx_resources_is_paid ON resources(is_paid);

-- Add index for author user id
CREATE INDEX IF NOT EXISTS idx_resources_author_user_id ON resources(author_user_id);

-- Update RLS policy to allow authors to manage their own resources
DROP POLICY IF EXISTS "Authors can update their resources" ON resources;
CREATE POLICY "Authors can update their resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

DROP POLICY IF EXISTS "Authors can delete their resources" ON resources;
CREATE POLICY "Authors can delete their resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (author_user_id = auth.uid());

-- Allow authenticated users to create resources
DROP POLICY IF EXISTS "Authenticated users can create resources" ON resources;
CREATE POLICY "Authenticated users can create resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (author_user_id = auth.uid());

-- Comment on columns
COMMENT ON COLUMN resources.is_paid IS 'Indicates if the resource is paid (true) or free (false)';
COMMENT ON COLUMN resources.price IS 'Price in GNF (Guinean Franc) - required if is_paid is true';
COMMENT ON COLUMN resources.author_email IS 'Contact email for the author (shown for paid resources)';
COMMENT ON COLUMN resources.author_phone IS 'Contact phone for the author (shown for paid resources)';
COMMENT ON COLUMN resources.author_user_id IS 'User ID of the resource author/publisher';
