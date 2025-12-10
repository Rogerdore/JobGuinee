import { useState, useEffect } from 'react';
import { FileText, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface TemplateSelectorProps {
  serviceCode: string;
  selectedTemplateId: string | null;
  onSelect: (templateId: string | null) => void;
  className?: string;
}

export default function TemplateSelector({
  serviceCode,
  selectedTemplateId,
  onSelect,
  className = ''
}: TemplateSelectorProps) {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    loadTemplates();
    loadUserCredits();
  }, [serviceCode, user]);

  const loadTemplates = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: templates, error } = await supabase
        .from('ia_service_templates')
        .select('*')
        .eq('service_code', serviceCode)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error loading templates:', error);
      } else {
        setTemplates(templates || []);
      }

      await loadUserCredits();
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCredits = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single();

      if (data) {
        setUserCredits(data.credits_balance || 0);
      }
    } catch (error) {
      console.error('Error loading user credits:', error);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <FileText className="w-4 h-4 inline mr-2" />
        Modèle de document
      </label>
      <select
        value={selectedTemplateId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      >
        <option value="">Template par défaut</option>
        {templates.map((template: any) => {
          const canAccess = template.can_access;
          const isPremium = template.is_premium;

          return (
            <option
              key={template.id}
              value={template.id}
              disabled={!canAccess}
            >
              {template.template_name}
              {' '}
              ({template.format.toUpperCase()})
              {isPremium && ` 👑 ${template.min_credits_required} crédits`}
              {!canAccess && ' - Crédits insuffisants'}
            </option>
          );
        })}
      </select>

      {templates.some((t: any) => t.is_premium && !t.can_access) && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Templates Premium disponibles</p>
              <p className="text-yellow-700">
                Vous avez <strong>{userCredits} crédits</strong>.
                Certains templates nécessitent plus de crédits.
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedTemplateId && templates.find((t: any) => t.id === selectedTemplateId)?.is_premium && (
        <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
            <p className="text-sm text-purple-700">
              Template Premium sélectionné - Design professionnel de haute qualité
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
