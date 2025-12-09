/*
  # Create Newsletter Subscribers Table

  ## Description
  Table for managing job alert email subscribers

  ## New Tables
  - `newsletter_subscribers` - Email subscription management

  ## Security
  - RLS enabled
  - Public can subscribe
*/

-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  domain text DEFAULT 'all',
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public subscriptions
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_domain ON newsletter_subscribers(domain);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_newsletter_updated_at_trigger ON newsletter_subscribers;
CREATE TRIGGER update_newsletter_updated_at_trigger
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_newsletter_updated_at();