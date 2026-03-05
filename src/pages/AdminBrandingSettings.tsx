import React, { useState, useEffect } from 'react';
import { Upload, Image, Save, AlertCircle, Facebook, Linkedin, Twitter, MessageCircle, Globe, Instagram, Youtube, CheckCircle, ExternalLink } from 'lucide-react';
import { siteSettingsService } from '../services/siteSettingsService';
import { useCMS } from '../contexts/CMSContext';

const SOCIAL_NETWORKS = [
  {
    key: 'social_facebook',
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/jobguinee',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hoverBorder: 'focus:border-blue-500 focus:ring-blue-500',
  },
  {
    key: 'social_instagram',
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/jobguinee',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    hoverBorder: 'focus:border-pink-500 focus:ring-pink-500',
  },
  {
    key: 'social_linkedin',
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/company/jobguinee',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    hoverBorder: 'focus:border-blue-700 focus:ring-blue-700',
  },
  {
    key: 'social_youtube',
    label: 'YouTube',
    icon: Youtube,
    placeholder: 'https://youtube.com/@jobguinee',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    hoverBorder: 'focus:border-red-500 focus:ring-red-500',
  },
  {
    key: 'social_twitter',
    label: 'Twitter / X',
    icon: Twitter,
    placeholder: 'https://twitter.com/JobGuinee',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    hoverBorder: 'focus:border-sky-500 focus:ring-sky-500',
  },
  {
    key: 'social_whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    placeholder: 'https://wa.me/224620000000',
    color: 'text-green-500',
    bg: 'bg-green-50',
    border: 'border-green-200',
    hoverBorder: 'focus:border-green-500 focus:ring-green-500',
  },
];

export default function AdminBrandingSettings() {
  const { updateSetting } = useCMS();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const brandingData = await siteSettingsService.getBrandingSettings();
      const socialSettings = await siteSettingsService.getSettingsByCategory('social');

      const combinedSettings = { ...brandingData };
      socialSettings.forEach((s: any) => {
        combinedSettings[s.key] = s.value;
      });

      setSettings(combinedSettings);
      setFaviconPreview(combinedSettings.favicon_url || '/favicon.png');
      setLogoPreview(combinedSettings.site_logo_url || '/logo_jobguinee.png');
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des paramètres' });
    } finally {
      setLoading(false);
    }
  };

  const handleFaviconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une image valide' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: "L'image ne doit pas dépasser 2 Mo" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setFaviconPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setSaving(true);
      const url = await siteSettingsService.updateFavicon(file);
      setSettings({ ...settings, favicon_url: url });
      setMessage({ type: 'success', text: 'Favicon mis à jour avec succès' });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du favicon' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner une image valide' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: "L'image ne doit pas dépasser 5 Mo" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setSaving(true);
      const url = await siteSettingsService.updateLogo(file);
      setSettings({ ...settings, site_logo_url: url });
      setMessage({ type: 'success', text: 'Logo mis à jour avec succès' });
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du logo' });
    } finally {
      setSaving(false);
    }
  };

  const handleSocialChange = (key: string, value: string) => {
    setSettings({ ...settings, [key]: value });
    setSavedKeys(prev => prev.filter(k => k !== key));
  };

  const saveSocialSettings = async () => {
    setSaving(true);
    try {
      const socialKeys = SOCIAL_NETWORKS.map(n => n.key);
      for (const key of socialKeys) {
        if (settings[key] !== undefined) {
          await updateSetting(key, settings[key]);
        }
      }
      setSavedKeys(SOCIAL_NETWORKS.map(n => n.key));
      setMessage({ type: 'success', text: 'Réseaux sociaux mis à jour avec succès' });
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde des réseaux sociaux' });
    } finally {
      setSaving(false);
    }
  };

  const activeCount = SOCIAL_NETWORKS.filter(n => !!settings[n.key]).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {message && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success'
            ? <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-600" />
            Identité visuelle
          </h2>
          <p className="text-sm text-gray-500 mt-1">Favicon et logo de la plateforme</p>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Favicon</h3>
              <p className="text-sm text-gray-500">L'icône dans l'onglet du navigateur</p>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                {faviconPreview ? (
                  <div className="space-y-3">
                    <img src={faviconPreview} alt="Favicon" className="h-14 w-14 mx-auto object-contain rounded-lg" />
                    <p className="text-xs text-gray-400">Favicon actuel</p>
                  </div>
                ) : (
                  <div className="text-gray-300">
                    <Upload className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">Aucun favicon</p>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFaviconChange}
                disabled={saving}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400">PNG, JPG ou SVG · max 2 Mo · recommandé 32×32 px</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-900">Logo principal</h3>
              <p className="text-sm text-gray-500">Le logo affiché dans la navigation</p>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50">
                {logoPreview ? (
                  <div className="space-y-3">
                    <img src={logoPreview} alt="Logo" className="h-14 mx-auto object-contain" />
                    <p className="text-xs text-gray-400">Logo actuel</p>
                  </div>
                ) : (
                  <div className="text-gray-300">
                    <Upload className="h-10 w-10 mx-auto mb-2" />
                    <p className="text-sm">Aucun logo</p>
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={saving}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-400">PNG, JPG ou SVG · max 5 Mo · fond transparent recommandé</p>
            </div>
          </div>

          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <ul className="text-sm text-amber-800 space-y-1">
                <li>Le changement de favicon peut prendre quelques minutes pour apparaître dans tous les navigateurs.</li>
                <li>Les utilisateurs devront peut-être vider leur cache pour voir les modifications.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Réseaux sociaux
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {activeCount === 0
                ? 'Aucun réseau configuré — les icônes seront masquées sur le site'
                : `${activeCount} réseau${activeCount > 1 ? 'x' : ''} configuré${activeCount > 1 ? 's' : ''} — visible${activeCount > 1 ? 's' : ''} dans l'en-tête et le pied de page`}
            </p>
          </div>
          {activeCount > 0 && (
            <div className="flex items-center gap-1">
              {SOCIAL_NETWORKS.filter(n => !!settings[n.key]).map(n => {
                const Icon = n.icon;
                return <Icon key={n.key} className={`w-5 h-5 ${n.color}`} />;
              })}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-5">
            {SOCIAL_NETWORKS.map(network => {
              const Icon = network.icon;
              const value = settings[network.key] || '';
              const isSaved = savedKeys.includes(network.key);
              const isActive = !!value;

              return (
                <div key={network.key} className={`rounded-xl border-2 p-4 transition-all ${isActive ? `${network.bg} ${network.border}` : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? network.bg : 'bg-gray-100'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? network.color : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-800">{network.label}</span>
                      {isActive && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Actif
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-1.5 rounded-lg ${network.bg} ${network.color} hover:opacity-70 transition`}
                        title="Voir le profil"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="url"
                      value={value}
                      onChange={(e) => handleSocialChange(network.key, e.target.value)}
                      placeholder={network.placeholder}
                      className={`w-full px-3 py-2 text-sm border rounded-lg transition-all outline-none ${
                        isActive
                          ? `border-transparent bg-white/70 ${network.hoverBorder} focus:ring-2`
                          : 'border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {isSaved && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Les champs vides ne seront pas affichés sur le site.
            </p>
            <button
              onClick={saveSocialSettings}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
