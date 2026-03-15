import React, { useState, useMemo } from 'react';
import { X, Facebook, Linkedin, Twitter, MessageCircle, Link2, Check, TrendingUp, Copy, FileText } from 'lucide-react';
import { Job } from '../../lib/supabase';
import { socialShareService, SocialShareLinks } from '../../services/socialShareService';
import SocialSharePreview from './SocialSharePreview';

interface ShareJobModalProps {
  job: Partial<Job> & {
    id: string;
    title: string;
    companies?: { name: string; logo_url?: string };
    company?: string;
    company_name?: string;
  };
  isOpen?: boolean;
  onClose: () => void;
}

export default function ShareJobModal({ job, isOpen = true, onClose }: ShareJobModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'facebook' | 'linkedin' | 'twitter' | 'generic'>('generic');
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const metadata = useMemo(() => socialShareService.generateJobMetadata(job), [job]);
  const links = useMemo(() => socialShareService.generateShareLinks(job), [job]);
  const marketingText = useMemo(() => socialShareService.generateMarketingText(job), [job]);

  if (!isOpen) return null;

  const handleShare = async (platform: keyof SocialShareLinks) => {
    setShareSuccess(null);
    setShareError(null);

    // Ouvrir le lien AVANT toute opération async (éviter popup blocker)
    const opened = socialShareService.openShareLink(platform, links);

    // Mettre à jour la preview APRES l'ouverture
    setSelectedPlatform(platform === 'whatsapp' ? 'generic' : platform);

    if (!opened) {
      setShareError('Le navigateur a bloqué l\'ouverture. Désactivez votre bloqueur de popups ou copiez le lien ci-dessous.');
      return;
    }

    setShareSuccess(platform);
    setTimeout(() => setShareSuccess(null), 3000);

    if (job.id) {
      await socialShareService.trackShare(job.id, platform);
    }
  };

  const handleCopyLink = async () => {
    try {
      await socialShareService.copyToClipboard(metadata.url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const shareButtons = [
    {
      platform: 'facebook' as const,
      label: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white'
    },
    {
      platform: 'linkedin' as const,
      label: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-sky-600 hover:bg-sky-700',
      textColor: 'text-white'
    },
    {
      platform: 'twitter' as const,
      label: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-slate-800 hover:bg-slate-900',
      textColor: 'text-white'
    },
    {
      platform: 'whatsapp' as const,
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#0E2F56] to-[#1a4a7e] rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Partager cette offre</h2>
              <p className="text-sm text-slate-600">Aidez quelqu'un à trouver son prochain emploi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Aperçu du partage
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Cet aperçu montre comment l'offre apparaîtra sur les réseaux sociaux
            </p>
            <SocialSharePreview metadata={metadata} platform={selectedPlatform} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Texte marketing à copier
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              Copiez ce texte et collez-le dans la zone « À quoi pensez-vous ? » sur Facebook ou LinkedIn
            </p>
            <div className="relative">
              <textarea
                value={marketingText}
                readOnly
                rows={10}
                className="w-full bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0E2F56] resize-none font-medium leading-relaxed"
              />
              <button
                onClick={async () => {
                  try {
                    await socialShareService.copyToClipboard(marketingText);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 3000);
                  } catch {}
                }}
                className={`absolute top-2 right-2 ${
                  copiedText ? 'bg-green-600' : 'bg-[#0E2F56] hover:bg-[#1a4a7e]'
                } text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5`}
              >
                {copiedText ? <><Check className="w-3.5 h-3.5" /> Copié !</> : <><Copy className="w-3.5 h-3.5" /> Copier le texte</>}
              </button>
            </div>
            {copiedText && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Texte copié ! Collez-le dans « À quoi pensez-vous ? » sur Facebook/LinkedIn
              </p>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">
              Partager sur les réseaux sociaux
            </h3>

            {shareError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{shareError}</span>
              </div>
            )}

            {shareSuccess && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Partage ouvert sur {shareSuccess} !</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {shareButtons.map(({ platform, label, icon: Icon, color, textColor }) => (
                <button
                  key={platform}
                  onClick={() => handleShare(platform)}
                  className={`${color} ${textColor} rounded-lg px-4 py-3 flex items-center justify-center gap-2 font-medium transition-all hover:scale-105 hover:shadow-lg active:scale-95`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Ou copier le lien
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={metadata.url}
                readOnly
                className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0E2F56]"
              />
              <button
                onClick={handleCopyLink}
                className={`${
                  copiedLink
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#0E2F56] hover:bg-[#1a4a7e]'
                } text-white rounded-lg px-4 py-2 font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 whitespace-nowrap`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    Copier
                  </>
                )}
              </button>
            </div>
            {copiedLink && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Le lien a été copié dans votre presse-papier
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 Astuce :</span> Plus vous partagez, plus vous aidez les candidats à trouver des opportunités et les recruteurs à atteindre les meilleurs talents !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
