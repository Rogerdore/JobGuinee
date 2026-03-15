import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Upload, Eye, RotateCcw, Info } from 'lucide-react';
import { useCMS } from '../contexts/CMSContext';
import { supabase } from '../lib/supabase';

const SETTING_KEY = 'og_poster_template';

const DEFAULTS = {
  header_gradient_start: '#0f172a',
  header_gradient_end: '#1e3a5f',
  accent_color: '#f97316',
  title_card_start: '#1e3a5f',
  title_card_end: '#2563eb',
  cta_gradient_start: '#f97316',
  cta_gradient_end: '#ea580c',
  cta_text: 'Postulez directement via JobGuinée',
  footer_url: 'www.jobguinee-pro.com',
  background_image_url: '',
  background_blur: 18,
  background_overlay_opacity: 0.75,
  logo_glow_enabled: true,
  logo_glow_color: '#ffffff',
  logo_glow_intensity: 8,
  card_border_radius: 16,
  info_card_columns: 3,
};

type TemplateConfig = typeof DEFAULTS;

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-10 rounded cursor-pointer border border-gray-300" />
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="block w-full mt-1 px-2 py-1 text-xs border rounded font-mono" />
      </div>
    </div>
  );
}

export default function AdminOGTemplate() {
  const { updateSetting, getSetting } = useCMS();
  const [config, setConfig] = useState<TemplateConfig>({ ...DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = getSetting(SETTING_KEY);
        if (raw && typeof raw === 'object') {
          setConfig({ ...DEFAULTS, ...(raw as Partial<TemplateConfig>) });
        }
      } catch { /* use defaults */ }
      setLoading(false);
    })();
  }, [getSetting]);

  const update = useCallback(<K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateSetting(SETTING_KEY, config as any, 'og_template', 'Configuration du template OG poster');
      setMessage({ type: 'success', text: 'Template sauvegardé avec succès' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde' });
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig({ ...DEFAULTS });
    setMessage({ type: 'success', text: 'Valeurs par défaut restaurées (non sauvegardé)' });
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une image' });
      return;
    }
    setUploadingBg(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `templates/background.${ext}`;
      const { error } = await supabase.storage
        .from('og-images')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data: pub } = supabase.storage.from('og-images').getPublicUrl(path);
      update('background_image_url', pub.publicUrl);
      setMessage({ type: 'success', text: 'Image de fond uploadée' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || "Erreur d'upload" });
    }
    setUploadingBg(false);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    setMessage(null);
    try {
      // Save first so edge function picks up the config
      await updateSetting(SETTING_KEY, config as any, 'og_template', 'Configuration du template OG poster');

      // Use a known job ID for preview
      const { data: sampleJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();

      if (!sampleJob) {
        setMessage({ type: 'error', text: 'Aucun emploi actif trouvé pour la prévisualisation' });
        setPreviewing(false);
        return;
      }

      const res = await supabase.functions.invoke('generate-job-og-image', {
        body: { job_id: sampleJob.id },
      });
      if (res.error) throw res.error;
      const url = res.data?.url;
      if (url) setPreviewUrl(url + '?t=' + Date.now());
      setMessage({ type: 'success', text: 'Aperçu généré avec succès' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erreur de prévisualisation' });
    }
    setPreviewing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Affiche OG</h1>
          <p className="text-sm text-gray-500 mt-1">Personnalisez le template des affiches de recrutement générées automatiquement</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Défaut
          </button>
          <button onClick={handlePreview} disabled={previewing} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            {previewing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Aperçu
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Sauvegarder
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COULEURS */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">🎨 Couleurs</h2>
          <div className="grid grid-cols-2 gap-4">
            <ColorField label="Header dégradé début" value={config.header_gradient_start} onChange={v => update('header_gradient_start', v)} />
            <ColorField label="Header dégradé fin" value={config.header_gradient_end} onChange={v => update('header_gradient_end', v)} />
            <ColorField label="Couleur accent" value={config.accent_color} onChange={v => update('accent_color', v)} />
            <ColorField label="Carte titre début" value={config.title_card_start} onChange={v => update('title_card_start', v)} />
            <ColorField label="Carte titre fin" value={config.title_card_end} onChange={v => update('title_card_end', v)} />
            <ColorField label="CTA dégradé début" value={config.cta_gradient_start} onChange={v => update('cta_gradient_start', v)} />
            <ColorField label="CTA dégradé fin" value={config.cta_gradient_end} onChange={v => update('cta_gradient_end', v)} />
          </div>
        </div>

        {/* IMAGE DE FOND */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">🖼️ Image de fond</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image d'arrière-plan</label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-gray-100 text-sm rounded-lg cursor-pointer hover:bg-gray-200 flex items-center gap-2 border">
                <Upload className="w-4 h-4" />
                {uploadingBg ? 'Upload...' : 'Choisir une image'}
                <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
              </label>
              {config.background_image_url && (
                <button onClick={() => update('background_image_url', '')} className="text-xs text-red-600 hover:underline">
                  Supprimer
                </button>
              )}
            </div>
            {config.background_image_url && (
              <img src={config.background_image_url} alt="Fond" className="mt-3 rounded-lg max-h-32 object-cover border" />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Intensité du flou : {config.background_blur}</label>
            <input type="range" min="0" max="40" value={config.background_blur} onChange={e => update('background_blur', Number(e.target.value))} className="w-full mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Opacité overlay : {config.background_overlay_opacity}</label>
            <input type="range" min="0" max="1" step="0.05" value={config.background_overlay_opacity} onChange={e => update('background_overlay_opacity', Number(e.target.value))} className="w-full mt-1" />
          </div>
        </div>

        {/* LOGO */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">✨ Logo Glow</h2>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={config.logo_glow_enabled} onChange={e => update('logo_glow_enabled', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm text-gray-700">Glow lumineux activé</span>
          </div>
          {config.logo_glow_enabled && (
            <>
              <ColorField label="Couleur du glow" value={config.logo_glow_color} onChange={v => update('logo_glow_color', v)} />
              <div>
                <label className="text-sm font-medium text-gray-700">Intensité : {config.logo_glow_intensity}</label>
                <input type="range" min="2" max="20" value={config.logo_glow_intensity} onChange={e => update('logo_glow_intensity', Number(e.target.value))} className="w-full mt-1" />
              </div>
            </>
          )}
        </div>

        {/* TEXTES */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">📝 Textes</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texte du bouton CTA</label>
            <input type="text" value={config.cta_text} onChange={e => update('cta_text', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL affichée en bas</label>
            <input type="text" value={config.footer_url} onChange={e => update('footer_url', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
          </div>
        </div>

        {/* MISE EN PAGE */}
        <div className="bg-white rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">📐 Mise en page</h2>
          <div>
            <label className="text-sm font-medium text-gray-700">Rayon des coins des cartes : {config.card_border_radius}px</label>
            <input type="range" min="0" max="28" value={config.card_border_radius} onChange={e => update('card_border_radius', Number(e.target.value))} className="w-full mt-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colonnes info cards</label>
            <div className="flex gap-3">
              {[2, 3].map(n => (
                <button key={n} onClick={() => update('info_card_columns', n)} className={`px-4 py-2 text-sm rounded-lg border ${config.info_card_columns === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                  {n} colonnes
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* VARIABLES REFERENCE */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <h2 className="font-semibold text-blue-900 flex items-center gap-2 mb-3"><Info className="w-4 h-4" /> Variables dynamiques</h2>
          <p className="text-xs text-blue-700 mb-2">Ces données sont récupérées automatiquement de chaque offre d'emploi :</p>
          <div className="grid grid-cols-2 gap-1 text-xs text-blue-800">
            {['Titre du poste', 'Nom entreprise', 'Logo entreprise', 'Localisation', 'Type de contrat', 'Expérience requise', 'Formation requise', 'Secteur', 'Salaire', 'Date publication', 'Date limite', 'Durée publication', 'Langue', 'Nb postes', 'Niveau', 'Badges Urgent/Vedette'].map(v => (
              <div key={v} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PREVIEW */}
      {previewUrl && (
        <div className="bg-white rounded-xl border p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Aperçu</h2>
          <div className="flex justify-center">
            <img src={previewUrl} alt="Aperçu affiche OG" className="max-w-md rounded-lg shadow-lg border" />
          </div>
        </div>
      )}
    </div>
  );
}
