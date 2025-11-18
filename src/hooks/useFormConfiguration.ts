import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FormSectionConfig {
  id: string;
  section_key: string;
  section_title: string;
  section_order: number;
  title_style: {
    fontSize: string;
    fontWeight: string;
    textTransform: string;
    color: string;
  };
  is_active: boolean;
  icon_name: string;
  description: string;
}

export function useFormConfiguration() {
  const [sections, setSections] = useState<Record<string, FormSectionConfig>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_form_configuration')
        .select('*')
        .eq('is_active', true)
        .order('section_order');

      if (error) throw error;

      if (data) {
        const configMap: Record<string, FormSectionConfig> = {};
        data.forEach((section) => {
          configMap[section.section_key] = section;
        });
        setSections(configMap);
      }
    } catch (error) {
      console.error('Error loading form configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSectionConfig = (sectionKey: string) => {
    return sections[sectionKey] || null;
  };

  const getTitleClasses = (sectionKey: string) => {
    const config = sections[sectionKey];
    if (!config) return 'text-xl font-bold uppercase text-gray-800';

    const { fontSize, fontWeight, textTransform, color } = config.title_style;
    return `text-${fontSize} font-${fontWeight} ${textTransform} text-${color}`;
  };

  return {
    sections,
    loading,
    getSectionConfig,
    getTitleClasses,
    refreshConfiguration: loadConfiguration
  };
}
