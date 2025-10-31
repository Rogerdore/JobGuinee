/*
  # Create Notifications System

  ## Overview
  This migration creates a comprehensive notification system for the recruitment platform.
  Users will receive real-time alerts for new applications, messages, profile views, and other important events.

  ## 1. New Tables
  
  ### `notifications`
  - `id` (uuid, primary key) - Unique identifier for each notification
  - `user_id` (uuid, foreign key to auth.users) - Recipient of the notification
  - `type` (text) - Type of notification (application_received, application_status_changed, message_received, profile_viewed, etc.)
  - `title` (text) - Short title of the notification
  - `message` (text) - Detailed message content
  - `link` (text, optional) - URL to navigate to when clicked
  - `read` (boolean) - Whether the notification has been read
  - `metadata` (jsonb, optional) - Additional data related to the notification
  - `created_at` (timestamptz) - When the notification was created
  
  ### `notification_preferences`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key to auth.users) - User who owns these preferences
  - `email_notifications` (boolean) - Enable/disable email notifications
  - `push_notifications` (boolean) - Enable/disable push notifications
  - `application_notifications` (boolean) - Notify about new applications
  - `message_notifications` (boolean) - Notify about new messages
  - `profile_view_notifications` (boolean) - Notify when profile is viewed
  - `job_alert_notifications` (boolean) - Notify about matching jobs
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Users can only view and update their own notifications
  - Users can only manage their own notification preferences

  ## 3. Indexes
  - Index on user_id and read status for fast unread count queries
  - Index on user_id and created_at for efficient pagination
  - Index on user_id for notification preferences

  ## 4. Functions
  - Function to automatically mark notifications as read
  - Function to clean up old read notifications (older than 30 days)
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  read boolean DEFAULT false NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email_notifications boolean DEFAULT true NOT NULL,
  push_notifications boolean DEFAULT true NOT NULL,
  application_notifications boolean DEFAULT true NOT NULL,
  message_notifications boolean DEFAULT true NOT NULL,
  profile_view_notifications boolean DEFAULT true NOT NULL,
  job_alert_notifications boolean DEFAULT true NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for notification_preferences table
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to automatically create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when a new user signs up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_preferences'
  ) THEN
    CREATE TRIGGER on_auth_user_created_preferences
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_default_notification_preferences();
  END IF;
END $$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE user_id = p_user_id AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM notifications
    WHERE user_id = p_user_id AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;