import { useState, useEffect } from 'react';
import { Play, FileText, ExternalLink, Download, Sparkles, User, Briefcase, GraduationCap } from 'lucide-react';
import { homepageContentService, VideoSettings, Guide } from '../../services/homepageContentService';
import { useAuth } from '../../contexts/AuthContext';

const iconMap: Record<string, any> = {
  FileText,
  ExternalLink,
  Download,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Play
};

export default function VideoGuidesSection() {
  const { profile } = useAuth();
  const [videoSettings, setVideoSettings] = useState<VideoSettings | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);

  useEffect(() => {
    loadContent();
  }, [profile]);

  const loadContent = async () => {
    try {
      const [settings, activeGuides] = await Promise.all([
        homepageContentService.getVideoSettings(),
        homepageContentService.getActiveGuides(profile?.user_type as any)
      ]);

      setVideoSettings(settings);
      setGuides(activeGuides);
    } catch (error) {
      console.error('Error loading homepage content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !videoSettings?.is_enabled) {
    return null;
  }

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be')
        ? url.split('/').pop()
        : new URLSearchParams(new URL(url).search).get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('/').pop();
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  const videoUrl = videoSettings.video_url || videoSettings.video_file_url;

  const renderVideoPlayer = () => {
    if (!videoUrl) return null;

    if (videoUrl.includes('youtube') || videoUrl.includes('vimeo')) {
      return (
        <iframe
          src={getVideoEmbedUrl(videoUrl)}
          className="w-full h-full rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }

    return (
      <video
        src={videoUrl}
        controls
        poster={videoSettings.thumbnail_url}
        className="w-full h-full rounded-2xl object-cover"
      />
    );
  };

  const renderGuideCard = (guide: Guide) => {
    const IconComponent = iconMap[guide.icon] || FileText;

    return (
      <div
        key={guide.id}
        className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group border border-gray-100"
        onClick={() => {
          if (guide.file_type === 'external_link') {
            window.open(guide.file_url, '_blank');
          } else {
            window.open(guide.file_url, '_blank');
          }
        }}
      >
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {guide.title}
            </h4>
            {guide.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {guide.description}
              </p>
            )}
            <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
              {guide.file_type === 'pdf' ? 'Télécharger le PDF' : 'Ouvrir le guide'}
              <ExternalLink className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section
      className="py-16"
      style={{ backgroundColor: videoSettings.background_color }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/10 to-orange-500/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Play className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-700">Vidéo & Guides</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {videoSettings.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {videoSettings.description}
          </p>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${videoSettings.layout === 'right' ? 'lg:grid-flow-dense' : ''}`}>
          {videoUrl && (
            <div className={`${videoSettings.layout === 'right' ? 'lg:col-start-2' : ''}`}>
              <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl group">
                {videoSettings.thumbnail_url && !showVideoModal ? (
                  <div
                    className="relative w-full h-full cursor-pointer"
                    onClick={() => setShowVideoModal(true)}
                  >
                    <img
                      src={videoSettings.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-10 h-10 text-blue-600 ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  renderVideoPlayer()
                )}
              </div>
            </div>
          )}

          <div className={`${videoSettings.layout === 'right' ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
            {guides.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Guides Utilisateurs
                </h3>
                {guides.map(renderGuideCard)}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">
                  Aucun guide disponible pour le moment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
