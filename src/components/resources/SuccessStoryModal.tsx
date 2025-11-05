import { X, MapPin, Briefcase, TrendingUp, Eye, Linkedin, Mail, Phone, CheckCircle, Play } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface SuccessStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  story: {
    id: string;
    author_name: string;
    profile_photo_url?: string;
    job_title: string;
    company?: string;
    industry: string;
    location?: string;
    summary: string;
    story_title: string;
    story_content: string;
    years_experience: number;
    view_count: number;
    achievements?: string[];
    linkedin_url?: string;
    email?: string;
    phone?: string;
  };
}

interface StoryMedia {
  id: string;
  media_type: 'image' | 'video';
  media_url: string;
  caption?: string;
  display_order: number;
}

export default function SuccessStoryModal({ isOpen, onClose, story }: SuccessStoryModalProps) {
  const [media, setMedia] = useState<StoryMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<StoryMedia | null>(null);

  useEffect(() => {
    if (isOpen && story.id) {
      loadMedia();
      incrementViewCount();
    }
  }, [isOpen, story.id]);

  const loadMedia = async () => {
    const { data } = await supabase
      .from('story_media')
      .select('*')
      .eq('story_id', story.id)
      .order('display_order');

    if (data) {
      setMedia(data);
    }
  };

  const incrementViewCount = async () => {
    await supabase.rpc('increment_story_views', { story_id: story.id });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-start justify-center p-4 pt-20">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full animate-in fade-in zoom-in duration-300 mb-20">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg transition"
          >
            <X className="w-6 h-6 text-gray-700" />
          </button>

          <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 rounded-t-2xl p-8 pb-24">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {story.profile_photo_url ? (
                <img
                  src={story.profile_photo_url}
                  alt={story.author_name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-4xl font-bold text-white">
                    {getInitials(story.author_name)}
                  </span>
                </div>
              )}

              <div className="flex-1 text-white">
                <h2 className="text-3xl font-bold mb-2">{story.author_name}</h2>
                <p className="text-xl text-blue-100 mb-3">{story.job_title}</p>
                {story.company && (
                  <p className="text-blue-200 flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5" />
                    {story.company}
                  </p>
                )}
                <p className="text-blue-100 leading-relaxed">{story.summary}</p>
              </div>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-gray-700">
                  <TrendingUp className="w-4 h-4" />
                  {story.years_experience} ans d'expérience
                </div>
                <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-gray-700">
                  {story.industry}
                </div>
                {story.location && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-gray-700">
                    <MapPin className="w-4 h-4" />
                    {story.location}
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-gray-700">
                  <Eye className="w-4 h-4" />
                  {story.view_count + 1} vues
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 max-h-[600px] overflow-y-auto">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{story.story_title}</h3>
              <div
                className="prose prose-blue max-w-none text-gray-700 leading-relaxed"
                style={{ whiteSpace: 'pre-line' }}
              >
                {story.story_content}
              </div>
            </div>

            {story.achievements && story.achievements.length > 0 && (
              <div className="mb-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-[#FF8C00]" />
                  Réalisations Clés
                </h4>
                <ul className="space-y-3">
                  {story.achievements.map((achievement, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-[#FF8C00] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 leading-relaxed">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {media.length > 0 && (
              <div className="mb-8">
                <h4 className="text-xl font-bold text-gray-900 mb-4">Galerie</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedMedia(item)}
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group bg-gray-100"
                    >
                      {item.media_type === 'image' ? (
                        <img
                          src={item.media_url}
                          alt={item.caption || 'Gallery image'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(story.linkedin_url || story.email || story.phone) && (
              <div className="border-t-2 border-gray-200 pt-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Contacter {story.author_name.split(' ')[0]}</h4>
                <div className="flex flex-wrap gap-3">
                  {story.linkedin_url && (
                    <a
                      href={story.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-[#0077B5] hover:bg-[#006399] text-white rounded-lg transition font-medium"
                    >
                      <Linkedin className="w-5 h-5" />
                      LinkedIn
                    </a>
                  )}
                  {story.email && (
                    <a
                      href={`mailto:${story.email}`}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition font-medium"
                    >
                      <Mail className="w-5 h-5" />
                      Email
                    </a>
                  )}
                  {story.phone && (
                    <a
                      href={`tel:${story.phone}`}
                      className="flex items-center gap-2 px-4 py-2 bg-[#FF8C00] hover:bg-orange-600 text-white rounded-lg transition font-medium"
                    >
                      <Phone className="w-5 h-5" />
                      Appeler
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            onClick={() => setSelectedMedia(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
          {selectedMedia.media_type === 'image' ? (
            <img
              src={selectedMedia.media_url}
              alt={selectedMedia.caption || 'Full size image'}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={selectedMedia.media_url}
              controls
              className="max-w-full max-h-full"
            />
          )}
          {selectedMedia.caption && (
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
                {selectedMedia.caption}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
