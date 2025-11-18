import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAutocomplete(category: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [category]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('autocomplete_suggestions')
        .select('value')
        .eq('category', category)
        .order('frequency', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        setSuggestions(data.map(item => item.value));
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const incrementFrequency = async (value: string) => {
    try {
      await supabase.rpc('increment_suggestion_frequency', {
        p_category: category,
        p_value: value
      });
    } catch (error) {
      console.error('Error incrementing frequency:', error);
    }
  };

  return { suggestions, loading, incrementFrequency };
}

export function useJobTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_templates')
        .select('*')
        .or('is_public.eq.true,user_id.eq.' + (await supabase.auth.getUser()).data.user?.id)
        .order('usage_count', { ascending: false });

      if (error) throw error;

      if (data) {
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (name: string, templateData: any, isPublic: boolean = false) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('job_templates')
        .insert({
          user_id: user.user.id,
          name,
          template_data: templateData,
          is_public: isPublic
        })
        .select()
        .single();

      if (error) throw error;

      await loadTemplates();
      return data;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  };

  const incrementTemplateUsage = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('job_templates')
        .update({ usage_count: supabase.raw('usage_count + 1') })
        .eq('id', templateId);

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing template usage:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('job_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  };

  return {
    templates,
    loading,
    saveTemplate,
    incrementTemplateUsage,
    deleteTemplate,
    refreshTemplates: loadTemplates
  };
}
