import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Save,
  AlertCircle,
  CheckCircle2,
  Loader,
  Share2,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  ArrowLeft,
} from 'lucide-react';

interface SocialMediaConfig {
  id: string;
  facebook_url: string;
  instagram_url: string;
  tiktok_url: string;
  youtube_url: string;
  linkedin_url: string;
  twitter_url: string;
  enable_facebook: boolean;
  enable_instagram: boolean;
  enable_tiktok: boolean;
  enable_youtube: boolean;
  enable_linkedin: boolean;
  enable_twitter: boolean;
}

interface SocialMediaConfigurationProps {
  onNavigate?: (page: string) => void;
}

export default function SocialMediaConfiguration({ onNavigate }: SocialMediaConfigurationProps = {}) {
  const [config, setConfig] = useState<SocialMediaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('social_media_configuration')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          setConfig({
            id: '',
            facebook_url: 'https://facebook.com/jobguinee',
            instagram_url: 'https://instagram.com/jobguinee',
            tiktok_url: 'https://tiktok.com/@jobguinee',
            youtube_url: 'https://youtube.com/@jobguinee',
            linkedin_url: 'https://linkedin.com/company/jobguinee',
            twitter_url: 'https://twitter.com/jobguinee',
            enable_facebook: false,
            enable_instagram: false,
            enable_tiktok: false,
            enable_youtube: false,
            enable_linkedin: false,
            enable_twitter: false,
          });
        } else {
          throw error;
        }
      } else {
        setConfig(data);
      }
    } catch (error: any) {
      console.error('Erreur chargement configuration:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement de la configuration.' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    setSaving(true);
    setMessage(null);

    try {
      if (config.id) {
        const { error } = await supabase
          .from('social_media_configuration')
          .update({
            facebook_url: config.facebook_url,
            instagram_url: config.instagram_url,
            tiktok_url: config.tiktok_url,
            youtube_url: config.youtube_url,
            linkedin_url: config.linkedin_url,
            twitter_url: config.twitter_url,
            enable_facebook: config.enable_facebook,
            enable_instagram: config.enable_instagram,
            enable_tiktok: config.enable_tiktok,
            enable_youtube: config.enable_youtube,
            enable_linkedin: config.enable_linkedin,
            enable_twitter: config.enable_twitter,
          })
          .eq('id', config.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('social_media_configuration')
          .insert({
            facebook_url: config.facebook_url,
            instagram_url: config.instagram_url,
            tiktok_url: config.tiktok_url,
            youtube_url: config.youtube_url,
            linkedin_url: config.linkedin_url,
            twitter_url: config.twitter_url,
            enable_facebook: config.enable_facebook,
            enable_instagram: config.enable_instagram,
            enable_tiktok: config.enable_tiktok,
            enable_youtube: config.enable_youtube,
            enable_linkedin: config.enable_linkedin,
            enable_twitter: config.enable_twitter,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setConfig(data);
      }

      setMessage({ type: 'success', text: 'Configuration sauvegardée avec succès!' });
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
        <p className="text-gray-600">Impossible de charger la configuration.</p>
      </div>
    );
  }

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
        enabled ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  const socialNetworks = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      urlKey: 'facebook_url' as keyof SocialMediaConfig,
      enableKey: 'enable_facebook' as keyof SocialMediaConfig,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      urlKey: 'instagram_url' as keyof SocialMediaConfig,
      enableKey: 'enable_instagram' as keyof SocialMediaConfig,
    },
    {
      name: 'TikTok',
      icon: Share2,
      color: 'text-gray-900',
      bgColor: 'bg-gray-50',
      urlKey: 'tiktok_url' as keyof SocialMediaConfig,
      enableKey: 'enable_tiktok' as keyof SocialMediaConfig,
    },
    {
      name: 'YouTube',
      icon: Youtube,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      urlKey: 'youtube_url' as keyof SocialMediaConfig,
      enableKey: 'enable_youtube' as keyof SocialMediaConfig,
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50',
      urlKey: 'linkedin_url' as keyof SocialMediaConfig,
      enableKey: 'enable_linkedin' as keyof SocialMediaConfig,
    },
    {
      name: 'Twitter/X',
      icon: Twitter,
      color: 'text-sky-500',
      bgColor: 'bg-sky-50',
      urlKey: 'twitter_url' as keyof SocialMediaConfig,
      enableKey: 'enable_twitter' as keyof SocialMediaConfig,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {onNavigate && (
          <button
            onClick={() => onNavigate('cms-admin')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour à l'administration</span>
          </button>
        )}
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <Share2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuration des Réseaux Sociaux</h1>
            <p className="text-gray-600 mt-1">Gérez les liens de vos réseaux sociaux affichés sur le site</p>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border-l-4 ${
              message.type === 'success'
                ? 'bg-green-50 border-green-500'
                : 'bg-red-50 border-red-500'
            }`}
          >
            <div className="flex items-center space-x-3">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p
                className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-900' : 'text-red-900'
                }`}
              >
                {message.text}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {socialNetworks.map((network) => {
            const Icon = network.icon;
            return (
              <div
                key={network.name}
                className={`${network.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-gray-200 transition`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                      <Icon className={`w-6 h-6 ${network.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{network.name}</h3>
                      <p className="text-sm text-gray-600">
                        {config[network.enableKey] ? 'Activé' : 'Désactivé'}
                      </p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={config[network.enableKey] as boolean}
                    onChange={() =>
                      setConfig({
                        ...config,
                        [network.enableKey]: !config[network.enableKey],
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL du profil
                  </label>
                  <input
                    type="url"
                    value={config[network.urlKey] as string}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        [network.urlKey]: e.target.value,
                      })
                    }
                    placeholder={`https://${network.name.toLowerCase()}.com/votreprofil`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 inline mr-2" />
            Les réseaux activés seront visibles à droite du menu principal
          </div>
          <button
            onClick={saveConfiguration}
            disabled={saving}
            className="bg-blue-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Sauvegarde...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Sauvegarder les modifications</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
