import {
  Briefcase, Users, BookOpen, FileText, GraduationCap,
  Mail, Phone, MapPin, Facebook, Twitter, Linkedin,
  Instagram, Youtube
} from 'lucide-react';
import { useCMS } from '../contexts/CMSContext';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { getSetting } = useCMS();

  const quickLinks = [
    { label: 'Accueil', page: 'home', icon: Briefcase },
    { label: 'Offres d\'emploi', page: 'jobs', icon: Briefcase },
    { label: 'Formations', page: 'formations', icon: GraduationCap },
    { label: 'Blog', page: 'blog', icon: FileText },
    { label: 'Ressources', page: 'resources', icon: BookOpen },
  ];

  const forCandidates = [
    { label: 'Rechercher un emploi', page: 'jobs' },
    { label: 'Créer mon CV', page: 'candidate-dashboard' },
    { label: 'Mes candidatures', page: 'candidate-dashboard' },
    { label: 'Services IA Premium', page: 'premium-ai-services' },
    { label: 'Alertes emploi', page: 'candidate-dashboard' },
  ];

  const forRecruiters = [
    { label: 'Publier une offre', page: 'recruiter-dashboard' },
    { label: 'CVthèque', page: 'cvtheque' },
    { label: 'Tableau de bord ATS', page: 'recruiter-dashboard' },
    { label: 'Plans Premium', page: 'recruiter-dashboard' },
    { label: 'Générateur IA', page: 'recruiter-dashboard' },
  ];

  const resources = [
    { label: 'Modèles de CV', page: 'resources' },
    { label: 'Lettres de motivation', page: 'resources' },
    { label: 'Guide d\'entretien', page: 'blog' },
    { label: 'Conseils carrière', page: 'blog' },
    { label: 'Success stories', page: 'resources' },
  ];

  const socialMedia = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: getSetting('social_facebook') || '#',
      color: 'hover:text-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: getSetting('social_twitter') || '#',
      color: 'hover:text-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: getSetting('social_linkedin') || '#',
      color: 'hover:text-blue-700'
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: getSetting('social_instagram') || '#',
      color: 'hover:text-pink-600'
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: getSetting('social_youtube') || '#',
      color: 'hover:text-red-600'
    },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-[#0E2F56] via-[#1a4275] to-[#0E2F56] text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Briefcase className="w-8 h-8 text-[#FF8C00]" />
              <span className="text-xl font-bold">Emploi Guinée</span>
            </div>
            <p className="text-blue-200 text-sm mb-4">
              La plateforme leader de recrutement en Guinée. Connectons les talents avec les opportunités.
            </p>
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span>Conakry, Guinée</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:contact@emploi-guinee.gn" className="hover:text-white transition">
                  contact@emploi-guinee.gn
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+224620000000" className="hover:text-white transition">
                  +224 620 00 00 00
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-[#FF8C00]">Navigation</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.page}>
                  <button
                    onClick={() => onNavigate(link.page)}
                    className="text-blue-200 hover:text-white transition text-sm flex items-center space-x-1"
                  >
                    <span>{link.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-[#FF8C00]">Pour les candidats</h3>
            <ul className="space-y-2">
              {forCandidates.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate(link.page)}
                    className="text-blue-200 hover:text-white transition text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-[#FF8C00]">Pour les recruteurs</h3>
            <ul className="space-y-2">
              {forRecruiters.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate(link.page)}
                    className="text-blue-200 hover:text-white transition text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-4 text-[#FF8C00]">Ressources</h3>
            <ul className="space-y-2">
              {resources.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => onNavigate(link.page)}
                    className="text-blue-200 hover:text-white transition text-sm"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-blue-200">
              © {currentYear} Emploi Guinée. Tous droits réservés.
            </div>

            <div className="flex items-center space-x-6">
              {socialMedia.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-blue-200 ${social.color} transition`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <button
                onClick={() => onNavigate('home')}
                className="text-blue-200 hover:text-white transition"
              >
                Conditions d'utilisation
              </button>
              <span className="text-blue-700">|</span>
              <button
                onClick={() => onNavigate('home')}
                className="text-blue-200 hover:text-white transition"
              >
                Politique de confidentialité
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-blue-700 text-center text-xs text-blue-300">
            <p className="mb-2">
              🇬🇳 Plateforme de recrutement 100% guinéenne - Propulsée par l'IA
            </p>
            <p>
              Mots-clés: emploi guinée, jobs conakry, recrutement guinée, offres emploi, carrière guinée,
              cv guinée, formation professionnelle, coaching carrière, cvthèque guinée
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
