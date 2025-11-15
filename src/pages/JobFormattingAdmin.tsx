import { useEffect, useState } from 'react';
import { Type, Save, Eye, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface FormattingStyle {
  fontWeight?: string;
  textTransform?: string;
  fontSize?: string;
  color?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  lineHeight?: string;
  listStyleType?: string;
}

interface FormattingConfig {
  id?: string;
  name: string;
  heading_level_1_style: FormattingStyle;
  heading_level_2_style: FormattingStyle;
  heading_level_3_style: FormattingStyle;
  text_style: FormattingStyle;
  list_style: FormattingStyle;
  is_active: boolean;
}

export default function JobFormattingAdmin() {
  const { profile } = useAuth();
  const [config, setConfig] = useState<FormattingConfig>({
    name: 'Configuration personnalisée',
    heading_level_1_style: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: '1.5rem',
      color: '#0E2F56',
      marginTop: '1.5rem',
      marginBottom: '1rem',
    },
    heading_level_2_style: {
      fontWeight: 'bold',
      textTransform: 'uppercase',
      fontSize: '1.25rem',
      color: '#FF8C00',
      marginTop: '1.25rem',
      marginBottom: '0.75rem',
    },
    heading_level_3_style: {
      fontWeight: '600',
      textTransform: 'capitalize',
      fontSize: '1.1rem',
      color: '#0E2F56',
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
    text_style: {
      fontSize: '1rem',
      lineHeight: '1.6',
      color: '#374151',
      marginBottom: '0.5rem',
    },
    list_style: {
      marginLeft: '1.5rem',
      marginBottom: '0.5rem',
      listStyleType: 'disc',
    },
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from('job_description_formatting')
      .select('*')
      .eq('is_active', true)
      .maybeSingle();

    if (data) {
      setConfig(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (config.id) {
        const { error } = await supabase
          .from('job_description_formatting')
          .update({
            name: config.name,
            heading_level_1_style: config.heading_level_1_style,
            heading_level_2_style: config.heading_level_2_style,
            heading_level_3_style: config.heading_level_3_style,
            text_style: config.text_style,
            list_style: config.list_style,
            updated_at: new Date().toISOString(),
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('job_description_formatting')
          .insert({
            ...config,
            is_active: true,
          });

        if (error) throw error;
      }

      alert('Configuration sauvegardée avec succès !');
      await loadConfig();
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateStyleProperty = (
    styleKey: keyof FormattingConfig,
    property: string,
    value: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      [styleKey]: {
        ...(prev[styleKey] as FormattingStyle),
        [property]: value,
      },
    }));
  };

  const sampleDescription = `# ASSISTANT(E) ACHATS

**Catégorie:** Ressources Humaines | **Contrat:** CDI | **Postes:** 1

## Présentation du poste
Nous recherchons un Assistant Achats pour appuyer le département dans la gestion quotidienne des approvisionnements.

## Missions principales
- Assurer la collecte des besoins internes
- Comparer les devis et analyser les offres
- Préparer et suivre les bons de commande

## Profil recherché
Le candidat doit être rigoureux, organisé et capable de gérer plusieurs demandes simultanément.

## Compétences clés
- Commerce international
- Gestion achats
- Logistique et transport

## Qualifications
- **Niveau d'études:** Licence
- **Expérience:** 3-5 ans
- **Langues:** Français, Anglais`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#FF8C00] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Type className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Configuration du formatage</h1>
                  <p className="text-blue-100">
                    Personnalisez l'apparence des descriptions d'offres d'emploi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2"
              >
                <Eye className="w-5 h-5" />
                {showPreview ? 'Masquer' : 'Afficher'} l'aperçu
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">#</span>
                    Titres principaux (H1)
                  </h2>
                  <StyleEditor
                    style={config.heading_level_1_style}
                    onChange={(property, value) =>
                      updateStyleProperty('heading_level_1_style', property, value)
                    }
                    showTransform
                  />
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">##</span>
                    Sous-titres (H2)
                  </h2>
                  <StyleEditor
                    style={config.heading_level_2_style}
                    onChange={(property, value) =>
                      updateStyleProperty('heading_level_2_style', property, value)
                    }
                    showTransform
                  />
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">###</span>
                    Titres de niveau 3 (H3)
                  </h2>
                  <StyleEditor
                    style={config.heading_level_3_style}
                    onChange={(property, value) =>
                      updateStyleProperty('heading_level_3_style', property, value)
                    }
                    showTransform
                  />
                </div>
              </div>

              {showPreview && (
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sticky top-8 h-fit">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Eye className="w-6 h-6 text-[#FF8C00]" />
                    Aperçu en temps réel
                  </h2>
                  <div className="prose max-w-none">
                    <FormattedDescription description={sampleDescription} config={config} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#0E2F56] to-blue-700 hover:from-[#1a4275] hover:to-blue-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sauvegarder la configuration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StyleEditor({
  style,
  onChange,
  showTransform,
}: {
  style: FormattingStyle;
  onChange: (property: string, value: string) => void;
  showTransform?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Épaisseur</label>
        <select
          value={style.fontWeight || 'normal'}
          onChange={(e) => onChange('fontWeight', e.target.value)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">Normal</option>
          <option value="500">Semi-gras (500)</option>
          <option value="600">Gras (600)</option>
          <option value="bold">Très gras (bold)</option>
        </select>
      </div>

      {showTransform && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Transformation</label>
          <select
            value={style.textTransform || 'none'}
            onChange={(e) => onChange('textTransform', e.target.value)}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">Aucune</option>
            <option value="uppercase">MAJUSCULES</option>
            <option value="capitalize">Première Lettre</option>
            <option value="lowercase">minuscules</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Taille</label>
        <input
          type="text"
          value={style.fontSize || '1rem'}
          onChange={(e) => onChange('fontSize', e.target.value)}
          placeholder="1rem, 18px, etc."
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Couleur</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={style.color || '#000000'}
            onChange={(e) => onChange('color', e.target.value)}
            className="w-16 h-10 border-2 border-gray-300 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={style.color || '#000000'}
            onChange={(e) => onChange('color', e.target.value)}
            className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function FormattedDescription({
  description,
  config,
}: {
  description: string;
  config: FormattingConfig;
}) {
  const renderLine = (line: string, index: number) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={index} style={config.heading_level_1_style}>
          {line.replace('# ', '')}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={index} style={config.heading_level_2_style}>
          {line.replace('## ', '')}
        </h2>
      );
    }
    if (line.startsWith('### ')) {
      return (
        <h3 key={index} style={config.heading_level_3_style}>
          {line.replace('### ', '')}
        </h3>
      );
    }
    if (line.startsWith('- ')) {
      return (
        <li key={index} style={config.list_style}>
          {line.replace('- ', '')}
        </li>
      );
    }
    if (line.trim() === '') {
      return <br key={index} />;
    }
    return (
      <p key={index} style={config.text_style}>
        {line}
      </p>
    );
  };

  return <div>{description.split('\n').map(renderLine)}</div>;
}
