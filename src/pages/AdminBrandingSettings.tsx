import React, { useState, useEffect } from 'react';
import { Upload, Image, Save, AlertCircle } from 'lucide-react';
import { siteSettingsService } from '../services/siteSettingsService';

export default function AdminBrandingSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [faviconPreview, setFaviconPreview] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const brandingData = await siteSettingsService.getBrandingSettings();
      setSettings(brandingData);
      setFaviconPreview(brandingData.favicon_url || '/favicon.png');
      setLogoPreview(brandingData.site_logo_url || '/logo_jobguinee.png');
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
      setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 2 Mo' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFaviconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setSaving(true);
      const url = await siteSettingsService.updateFavicon(file);
      setSettings({ ...settings, favicon_url: url });
      setMessage({ type: 'success', text: 'Favicon mis à jour avec succès' });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du favicon:', error);
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
      setMessage({ type: 'error', text: 'L\'image ne doit pas dépasser 5 Mo' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setSaving(true);
      const url = await siteSettingsService.updateLogo(file);
      setSettings({ ...settings, site_logo_url: url });
      setMessage({ type: 'success', text: 'Logo mis à jour avec succès' });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du logo:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour du logo' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Image className="h-6 w-6 text-blue-600" />
            Paramètres de Branding
          </h2>
          <p className="text-gray-600 mt-2">
            Gérer le favicon et le logo de JobGuinée
          </p>
        </div>

        {message && (
          <div className={`mx-6 mt-6 p-4 rounded-lg flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{message.text}</p>
          </div>
        )}

        <div className="p-6 space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Favicon</h3>
                <p className="text-sm text-gray-600 mb-4">
                  L'icône qui apparaît dans l'onglet du navigateur
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {faviconPreview ? (
                  <div className="space-y-4">
                    <img
                      src={faviconPreview}
                      alt="Aperçu du favicon"
                      className="h-16 w-16 mx-auto object-contain"
                    />
                    <p className="text-sm text-gray-600">Aperçu actuel</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="h-12 w-12 mx-auto mb-2" />
                    <p>Aucun favicon</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block">
                  <span className="sr-only">Choisir un nouveau favicon</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconChange}
                    disabled={saving}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG ou SVG. Taille maximale: 2 Mo. Recommandé: 32x32px ou 64x64px
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Logo Principal</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Le logo utilisé sur le site
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {logoPreview ? (
                  <div className="space-y-4">
                    <img
                      src={logoPreview}
                      alt="Aperçu du logo"
                      className="h-16 mx-auto object-contain"
                    />
                    <p className="text-sm text-gray-600">Aperçu actuel</p>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload className="h-12 w-12 mx-auto mb-2" />
                    <p>Aucun logo</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block">
                  <span className="sr-only">Choisir un nouveau logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    disabled={saving}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  PNG, JPG ou SVG. Taille maximale: 5 Mo. Format recommandé: transparent
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Informations importantes
            </h4>
            <ul className="text-sm text-blue-800 space-y-1 ml-7">
              <li>Le changement du favicon peut prendre quelques minutes pour apparaître dans tous les navigateurs</li>
              <li>Les utilisateurs devront peut-être vider leur cache pour voir le nouveau favicon</li>
              <li>La page se rechargera automatiquement après la mise à jour</li>
            </ul>
          </div>
        </div>

        {saving && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="font-medium">Mise à jour en cours...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
