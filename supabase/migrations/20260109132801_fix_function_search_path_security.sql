/*
  # Fix Function Search Path Security

  1. Security Fix
    - Sets search_path for all SECURITY DEFINER functions
    - Prevents search path hijacking attacks
    - Protects against malicious schema manipulation
    
  2. Security Impact
    - Eliminates a critical vulnerability where attackers could create malicious
      schemas/functions that get called instead of intended functions
    - Sets explicit search_path = public, pg_temp for all sensitive functions
    
  3. Functions Fixed
    - All SECURITY DEFINER functions now have explicit search_path
    - Prevents privilege escalation attacks
*/

-- Get all SECURITY DEFINER functions and set their search_path
DO $$
DECLARE
  func RECORD;
  func_signature TEXT;
BEGIN
  FOR func IN 
    SELECT 
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND NOT EXISTS (
        SELECT 1 
        FROM unnest(p.proconfig) AS config
        WHERE config LIKE 'search_path=%'
      )
  LOOP
    func_signature := func.function_name || '(' || func.args || ')';
    
    BEGIN
      EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp', 
                     func.function_name, 
                     func.args);
      RAISE NOTICE 'Fixed search_path for function: %', func_signature;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not fix function %: %', func_signature, SQLERRM;
    END;
  END LOOP;
END $$;
