import { useState, useEffect } from 'react';
import { Facebook, Instagram, Youtube, Linkedin, Twitter, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SocialMedia {
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  youtube_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  enable_facebook?: boolean;
  enable_instagram?: boolean;
  enable_tiktok?: boolean;
  enable_youtube?: boolean;
  enable_linkedin?: boolean;
  enable_twitter?: boolean;
}

export default function FloatingSocialMedia() {
  const [socialMedia, setSocialMedia] = useState<SocialMedia | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadSocialMedia();

    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadSocialMedia = async () => {
    try {
      const { data } = await supabase
        .from('social_media_configuration')
        .select('*')
        .single();

      if (data) {
        setSocialMedia(data);
      }
    } catch (error) {
      console.error('Erreur chargement réseaux sociaux:', error);
    }
  };

  if (!socialMedia) return null;

  const hasAnySocialMedia =
    (socialMedia.enable_facebook && socialMedia.facebook_url) ||
    (socialMedia.enable_instagram && socialMedia.instagram_url) ||
    (socialMedia.enable_tiktok && socialMedia.tiktok_url) ||
    (socialMedia.enable_youtube && socialMedia.youtube_url) ||
    (socialMedia.enable_linkedin && socialMedia.linkedin_url) ||
    (socialMedia.enable_twitter && socialMedia.twitter_url);

  if (!hasAnySocialMedia) return null;

  return (
    <div
      className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 ${
        isVisible ? 'translate-x-0' : '-translate-x-full'
      } hidden lg:block`}
    >
      <div className="bg-white rounded-r-2xl shadow-2xl overflow-hidden border-r-4 border-blue-900">
        <div className="flex flex-col space-y-0.5">
          {socialMedia.enable_facebook && socialMedia.facebook_url && (
            <a
              href={socialMedia.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 hover:pr-6"
              title="Facebook"
            >
              <Facebook className="w-5 h-5" />
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                Facebook
              </span>
            </a>
          )}

          {socialMedia.enable_instagram && socialMedia.instagram_url && (
            <a
              href={socialMedia.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 text-white bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 transition-all duration-300 hover:pr-6"
              title="Instagram"
            >
              <Instagram className="w-5 h-5" />
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-pink-500 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                Instagram
              </span>
            </a>
          )}

          {socialMedia.enable_tiktok && socialMedia.tiktok_url && (
            <a
              href={socialMedia.tiktok_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 text-white bg-gray-900 hover:bg-black transition-all duration-300 hover:pr-6"
              title="TikTok"
            >
              <Share2 className="w-5 h-5" />
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                TikTok
              </span>
            </a>
          )}

          {socialMedia.enable_youtube && socialMedia.youtube_url && (
            <a
              href={socialMedia.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 text-white bg-red-600 hover:bg-red-700 transition-all duration-300 hover:pr-6"
              title="YouTube"
            >
              <Youtube className="w-5 h-5" />
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                YouTube
              </span>
            </a>
          )}

          {socialMedia.enable_linkedin && socialMedia.linkedin_url && (
            <a
              href={socialMedia.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 text-white bg-blue-700 hover:bg-blue-800 transition-all duration-300 hover:pr-6"
              title="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                LinkedIn
              </span>
            </a>
          )}

          {socialMedia.enable_twitter && socialMedia.twitter_url && (
            <a
              href={socialMedia.twitter_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-3.5 text-white bg-sky-500 hover:bg-sky-600 transition-all duration-300 hover:pr-6"
              title="Twitter/X"
            >
              <Twitter className="w-5 h-5" />
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                Twitter/X
              </span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
