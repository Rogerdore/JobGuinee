import { X, Facebook, Linkedin, Twitter, MessageCircle, Link2, Check } from 'lucide-react';
import { useState } from 'react';
import {
  shareFacebookJob,
  shareLinkedInJob,
  shareTwitterJob,
  shareWhatsAppJob,
  generateJobShareMeta,
  updateSocialMetaTags
} from '../../utils/socialShareMeta';

interface ShareJobModalProps {
  job: {
    id: string;
    title: string;
    description?: string;
    location?: string;
    contract_type?: string;
    companies?: { name: string; logo_url?: string };
  };
  onClose: () => void;
}

export default function ShareJobModal({ job, onClose }: ShareJobModalProps) {
  const [copied, setCopied] = useState(false);
  const jobUrl = `${window.location.origin}/job/${job.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(jobUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: 'facebook' | 'linkedin' | 'twitter' | 'whatsapp') => {
    // Update meta tags for better preview
    const meta = generateJobShareMeta(job);
    updateSocialMetaTags(meta);

    // Share to platform
    switch (platform) {
      case 'facebook':
        shareFacebookJob(job);
        break;
      case 'linkedin':
        shareLinkedInJob(job);
        break;
      case 'twitter':
        shareTwitterJob(job);
        break;
      case 'whatsapp':
        shareWhatsAppJob(job);
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Partager cette offre
          </h3>
          <p className="text-gray-600 text-sm">
            Partagez cette opportunité avec votre réseau
          </p>
        </div>

        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
            {job.title}
          </h4>
          <p className="text-sm text-gray-600">
            {job.companies?.name} • {job.location}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleShare('facebook')}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition group"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Facebook className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Facebook</div>
              <div className="text-xs text-gray-500">Partager sur Facebook</div>
            </div>
          </button>

          <button
            onClick={() => handleShare('linkedin')}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-blue-700 hover:bg-blue-50 transition group"
          >
            <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Linkedin className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">LinkedIn</div>
              <div className="text-xs text-gray-500">Partager sur LinkedIn</div>
            </div>
          </button>

          <button
            onClick={() => handleShare('twitter')}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-sky-500 hover:bg-sky-50 transition group"
          >
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <Twitter className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Twitter / X</div>
              <div className="text-xs text-gray-500">Partager sur Twitter</div>
            </div>
          </button>

          <button
            onClick={() => handleShare('whatsapp')}
            className="w-full flex items-center space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition group"
          >
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
              <MessageCircle className="w-5 h-5 text-white" fill="currentColor" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">WhatsApp</div>
              <div className="text-xs text-gray-500">Partager sur WhatsApp</div>
            </div>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="text-sm font-medium text-gray-700 block mb-2">
            Ou copier le lien
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={jobUrl}
              readOnly
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-4 py-3 rounded-lg font-medium transition ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-[#FF8C00] hover:bg-[#e67e00] text-white'
              }`}
            >
              {copied ? (
                <Check className="w-5 h-5" />
              ) : (
                <Link2 className="w-5 h-5" />
              )}
            </button>
          </div>
          {copied && (
            <p className="text-xs text-green-600 mt-2">
              Lien copié dans le presse-papier!
            </p>
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-start space-x-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-900 font-medium mb-1">
                Preview optimisé pour Facebook
              </p>
              <p className="text-xs text-blue-700">
                Les informations de cette offre s'afficheront avec une belle carte visuelle lors du partage sur Facebook et autres réseaux sociaux.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
