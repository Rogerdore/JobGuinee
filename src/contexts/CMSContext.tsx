import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface SiteSetting {
  setting_key: string;
  setting_value: any;
  category: string;
}

interface CMSSection {
  section_key: string;
  section_name: string;
  content: any;
  section_type: string;
}

interface CMSContextType {
  settings: Record<string, any>;
  sections: Record<string, any>;
  loading: boolean;
  getSetting: (key: string, defaultValue?: any) => any;
  getSection: (key: string) => any;
  updateSetting: (key: string, value: any) => Promise<void>;
  updateSection: (key: string, content: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export function CMSProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [sections, setSections] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('*')
        .eq('is_public', true);

      const { data: sectionsData } = await supabase
        .from('cms_sections')
        .select('*')
        .eq('status', 'active')
        .order('display_order');

      if (settingsData) {
        const settingsMap: Record<string, any> = {};
        settingsData.forEach((setting: SiteSetting) => {
          if (setting.setting_value) {
            settingsMap[setting.setting_key] = typeof setting.setting_value === 'object'
              ? setting.setting_value.value || setting.setting_value
              : setting.setting_value;
          }
        });
        setSettings(settingsMap);
      }

      if (sectionsData) {
        const sectionsMap: Record<string, any> = {};
        sectionsData.forEach((section: CMSSection) => {
          sectionsMap[section.section_key] = section.content;
        });
        setSections(sectionsMap);
      }
    } catch (error) {
      console.error('Error loading CMS data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    const settingsSubscription = supabase
      .channel('site_settings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => {
        loadSettings();
      })
      .subscribe();

    const sectionsSubscription = supabase
      .channel('cms_sections_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cms_sections' }, () => {
        loadSettings();
      })
      .subscribe();

    return () => {
      settingsSubscription.unsubscribe();
      sectionsSubscription.unsubscribe();
    };
  }, []);

  const getSetting = (key: string, defaultValue: any = null) => {
    return settings[key] ?? defaultValue;
  };

  const getSection = (key: string) => {
    return sections[key] ?? null;
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ setting_value: { value } })
        .eq('setting_key', key);

      if (error) throw error;
      await loadSettings();
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const updateSection = async (key: string, content: any) => {
    try {
      const { error } = await supabase
        .from('cms_sections')
        .update({ content })
        .eq('section_key', key);

      if (error) throw error;
      await loadSettings();
    } catch (error) {
      console.error('Error updating section:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    await loadSettings();
  };

  return (
    <CMSContext.Provider
      value={{
        settings,
        sections,
        loading,
        getSetting,
        getSection,
        updateSetting,
        updateSection,
        refreshSettings,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (context === undefined) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
}
