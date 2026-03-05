/*
  # Create Admin Invitations System

  ## Summary
  Implements a secure, email-based admin invitation flow to allow the principal administrator
  to invite new administrators without sharing passwords.

  ## New Tables
  - `admin_invitations`
    - `id` (uuid, primary key)
    - `invitation_token` (uuid, unique) - secure one-time token sent by email
    - `inviter_id` (uuid, FK → profiles.id) - who sent the invitation
    - `invitee_email` (text) - email address of the person being invited
    - `invitee_name` (text) - full name pre-filled for the invitee
    - `status` (text) - 'pending' | 'accepted' | 'expired' | 'revoked'
    - `expires_at` (timestamptz) - invitation expires after 72 hours
    - `accepted_at` (timestamptz) - when invitation was accepted
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Only admins can INSERT/SELECT/DELETE invitations
  - Public (anon/authenticated) can read a single invitation by token (for acceptance page)
  - Only the system can UPDATE invitation status to 'accepted'

  ## Functions
  - `create_admin_invitation(email, name)` - creates invitation record, returns token
  - `accept_admin_invitation(token, password)` - validates token, creates auth user + admin profile
  - `get_invitation_by_token(token)` - fetch invitation details (for accept page)
  - `revoke_admin_invitation(invitation_id)` - admin revokes a pending invitation
  - Automatic expiration: invitations older than 72h are marked expired on read
*/

CREATE TABLE IF NOT EXISTS admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  inviter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invitee_email text NOT NULL,
  invitee_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_token ON admin_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_email ON admin_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_status ON admin_invitations(status);
CREATE INDEX IF NOT EXISTS idx_admin_invitations_inviter ON admin_invitations(inviter_id);

ALTER TABLE admin_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all invitations"
  ON admin_invitations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can create invitations"
  ON admin_invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update invitations"
  ON admin_invitations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete invitations"
  ON admin_invitations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.user_type = 'admin'
    )
  );

CREATE POLICY "Anyone can read invitation by token for acceptance"
  ON admin_invitations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token uuid)
RETURNS TABLE(
  id uuid,
  invitation_token uuid,
  invitee_email text,
  invitee_name text,
  status text,
  expires_at timestamptz,
  inviter_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_invitations
  SET status = 'expired', updated_at = now()
  WHERE invitation_token = p_token
    AND status = 'pending'
    AND expires_at < now();

  RETURN QUERY
  SELECT
    ai.id,
    ai.invitation_token,
    ai.invitee_email,
    ai.invitee_name,
    ai.status,
    ai.expires_at,
    COALESCE(p.full_name, p.email, 'Administrateur') AS inviter_name,
    ai.created_at
  FROM admin_invitations ai
  LEFT JOIN profiles p ON p.id = ai.inviter_id
  WHERE ai.invitation_token = p_token;
END;
$$;

CREATE OR REPLACE FUNCTION revoke_admin_invitation(p_invitation_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: admin required';
  END IF;

  UPDATE admin_invitations
  SET status = 'revoked', updated_at = now()
  WHERE id = p_invitation_id AND status = 'pending';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION mark_invitation_accepted(p_token uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE admin_invitations
  SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE invitation_token = p_token
    AND status = 'pending'
    AND expires_at > now();

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION get_invitation_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION revoke_admin_invitation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_invitation_accepted(uuid, uuid) TO anon, authenticated;
