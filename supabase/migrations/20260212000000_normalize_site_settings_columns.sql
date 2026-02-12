-- Migration to normalize site_settings columns if they are still using old names
DO $$
BEGIN
    -- Rename setting_key to key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='setting_key') THEN
        ALTER TABLE public.site_settings RENAME COLUMN setting_key TO key;
    END IF;

    -- Rename setting_value to value if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_settings' AND column_name='setting_value') THEN
        ALTER TABLE public.site_settings RENAME COLUMN setting_value TO value;
    END IF;
END $$;
