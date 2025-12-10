/*
  # Système de Sécurité IA - Protection contre Abus
  
  1. Tables
    - ai_rate_limits: Suivi des appels IA par utilisateur (rate limiting)
    - ai_security_logs: Logs de sécurité (blocages, tentatives abusives)
    - ai_user_restrictions: Restrictions spécifiques par utilisateur
    
  2. Fonctions
    - check_ai_rate_limit: Vérifie limites d'appels
    - log_ai_security_event: Enregistre événements de sécurité
    
  3. Security
    - RLS sur toutes les tables
    - Policies restrictives
*/

-- Table des limites de taux (rate limiting)
CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_code text NOT NULL,
  window_type text NOT NULL CHECK (window_type IN ('minute', 'hour', 'day')),
  call_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_code, window_type, window_start)
);

-- Table des logs de sécurité
CREATE TABLE IF NOT EXISTS ai_security_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  service_code text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('allowed', 'blocked', 'warning', 'suspicious')),
  reason text NOT NULL,
  call_count_minute integer,
  call_count_hour integer,
  call_count_day integer,
  ip_address text,
  user_agent text,
  request_payload jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table des restrictions utilisateur
CREATE TABLE IF NOT EXISTS ai_user_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  is_suspended boolean NOT NULL DEFAULT false,
  suspension_reason text,
  suspension_until timestamptz,
  custom_rate_limit_minute integer,
  custom_rate_limit_hour integer,
  custom_rate_limit_day integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_user ON ai_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_service ON ai_rate_limits(service_code);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_window ON ai_rate_limits(window_type, window_start);
CREATE INDEX IF NOT EXISTS idx_ai_security_logs_user ON ai_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_security_logs_event ON ai_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_ai_security_logs_created ON ai_security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_restrictions_user ON ai_user_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_restrictions_suspended ON ai_user_restrictions(is_suspended);

-- Enable RLS
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_restrictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_rate_limits
CREATE POLICY "Users can view own rate limits"
  ON ai_rate_limits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage rate limits"
  ON ai_rate_limits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all rate limits"
  ON ai_rate_limits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies for ai_security_logs
CREATE POLICY "Users can view own security logs"
  ON ai_security_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create security logs"
  ON ai_security_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all security logs"
  ON ai_security_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies for ai_user_restrictions
CREATE POLICY "Users can view own restrictions"
  ON ai_user_restrictions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all restrictions"
  ON ai_user_restrictions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Function: Log security event
CREATE OR REPLACE FUNCTION log_ai_security_event(
  p_user_id uuid,
  p_service_code text,
  p_event_type text,
  p_reason text,
  p_call_count_minute integer DEFAULT NULL,
  p_call_count_hour integer DEFAULT NULL,
  p_call_count_day integer DEFAULT NULL,
  p_request_payload jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
  v_user_email text;
BEGIN
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  INSERT INTO ai_security_logs (
    user_id,
    user_email,
    service_code,
    event_type,
    reason,
    call_count_minute,
    call_count_hour,
    call_count_day,
    request_payload
  ) VALUES (
    p_user_id,
    v_user_email,
    p_service_code,
    p_event_type,
    p_reason,
    p_call_count_minute,
    p_call_count_hour,
    p_call_count_day,
    p_request_payload
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- Function: Check rate limits
CREATE OR REPLACE FUNCTION check_ai_rate_limit(
  p_user_id uuid,
  p_service_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now timestamptz := now();
  v_minute_start timestamptz := date_trunc('minute', v_now);
  v_hour_start timestamptz := date_trunc('hour', v_now);
  v_day_start timestamptz := date_trunc('day', v_now);
  v_minute_count integer := 0;
  v_hour_count integer := 0;
  v_day_count integer := 0;
  v_max_minute integer := 10;
  v_max_hour integer := 100;
  v_max_day integer := 500;
  v_restrictions record;
  v_is_suspended boolean := false;
  v_suspension_reason text;
BEGIN
  -- Check user restrictions
  SELECT * INTO v_restrictions
  FROM ai_user_restrictions
  WHERE user_id = p_user_id;

  IF FOUND THEN
    -- Check suspension
    IF v_restrictions.is_suspended THEN
      IF v_restrictions.suspension_until IS NULL OR v_restrictions.suspension_until > v_now THEN
        v_is_suspended := true;
        v_suspension_reason := v_restrictions.suspension_reason;
        
        PERFORM log_ai_security_event(
          p_user_id,
          p_service_code,
          'blocked',
          'User suspended: ' || COALESCE(v_suspension_reason, 'No reason provided'),
          NULL, NULL, NULL, NULL
        );
        
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'USER_SUSPENDED',
          'message', 'Votre compte est suspendu. Raison: ' || COALESCE(v_suspension_reason, 'Non spécifiée')
        );
      END IF;
    END IF;

    -- Apply custom limits if set
    IF v_restrictions.custom_rate_limit_minute IS NOT NULL THEN
      v_max_minute := v_restrictions.custom_rate_limit_minute;
    END IF;
    IF v_restrictions.custom_rate_limit_hour IS NOT NULL THEN
      v_max_hour := v_restrictions.custom_rate_limit_hour;
    END IF;
    IF v_restrictions.custom_rate_limit_day IS NOT NULL THEN
      v_max_day := v_restrictions.custom_rate_limit_day;
    END IF;
  END IF;

  -- Count calls in minute window
  SELECT COALESCE(SUM(call_count), 0) INTO v_minute_count
  FROM ai_rate_limits
  WHERE user_id = p_user_id
    AND service_code = p_service_code
    AND window_type = 'minute'
    AND window_start >= v_minute_start
    AND window_end > v_now;

  -- Count calls in hour window
  SELECT COALESCE(SUM(call_count), 0) INTO v_hour_count
  FROM ai_rate_limits
  WHERE user_id = p_user_id
    AND service_code = p_service_code
    AND window_type = 'hour'
    AND window_start >= v_hour_start
    AND window_end > v_now;

  -- Count calls in day window
  SELECT COALESCE(SUM(call_count), 0) INTO v_day_count
  FROM ai_rate_limits
  WHERE user_id = p_user_id
    AND service_code = p_service_code
    AND window_type = 'day'
    AND window_start >= v_day_start
    AND window_end > v_now;

  -- Check limits
  IF v_minute_count >= v_max_minute THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_code,
      'blocked',
      'Rate limit exceeded: minute',
      v_minute_count,
      v_hour_count,
      v_day_count,
      NULL
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'RATE_LIMIT_MINUTE',
      'message', 'Vous avez dépassé le nombre de requêtes autorisées par minute. Veuillez patienter.',
      'limit', v_max_minute,
      'current', v_minute_count
    );
  END IF;

  IF v_hour_count >= v_max_hour THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_code,
      'blocked',
      'Rate limit exceeded: hour',
      v_minute_count,
      v_hour_count,
      v_day_count,
      NULL
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'RATE_LIMIT_HOUR',
      'message', 'Vous avez dépassé le nombre de requêtes autorisées par heure. Veuillez réessayer plus tard.',
      'limit', v_max_hour,
      'current', v_hour_count
    );
  END IF;

  IF v_day_count >= v_max_day THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_code,
      'blocked',
      'Rate limit exceeded: day',
      v_minute_count,
      v_hour_count,
      v_day_count,
      NULL
    );
    
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'RATE_LIMIT_DAY',
      'message', 'Vous avez dépassé le nombre de requêtes autorisées aujourd''hui. Veuillez réessayer demain.',
      'limit', v_max_day,
      'current', v_day_count
    );
  END IF;

  -- Warning if approaching limits
  IF v_minute_count >= v_max_minute * 0.8 OR v_hour_count >= v_max_hour * 0.8 OR v_day_count >= v_max_day * 0.8 THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_code,
      'warning',
      'Approaching rate limit',
      v_minute_count,
      v_hour_count,
      v_day_count,
      NULL
    );
  END IF;

  -- Increment counters
  INSERT INTO ai_rate_limits (user_id, service_code, window_type, call_count, window_start, window_end)
  VALUES 
    (p_user_id, p_service_code, 'minute', 1, v_minute_start, v_minute_start + interval '1 minute'),
    (p_user_id, p_service_code, 'hour', 1, v_hour_start, v_hour_start + interval '1 hour'),
    (p_user_id, p_service_code, 'day', 1, v_day_start, v_day_start + interval '1 day')
  ON CONFLICT (user_id, service_code, window_type, window_start)
  DO UPDATE SET 
    call_count = ai_rate_limits.call_count + 1,
    updated_at = now();

  RETURN jsonb_build_object(
    'allowed', true,
    'calls_minute', v_minute_count + 1,
    'calls_hour', v_hour_count + 1,
    'calls_day', v_day_count + 1,
    'limit_minute', v_max_minute,
    'limit_hour', v_max_hour,
    'limit_day', v_max_day
  );
END;
$$;

-- Cleanup old rate limit data (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM ai_rate_limits
  WHERE window_end < now() - interval '7 days';
  
  DELETE FROM ai_security_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;