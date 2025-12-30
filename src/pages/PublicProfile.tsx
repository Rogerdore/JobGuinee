import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  FileText,
  Download,
  Linkedin,
  Globe,
  Github,
  Calendar,
  Building2,
  ExternalLink,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { publicProfileTokenService, PublicProfileData } from '../services/publicProfileTokenService';

interface PublicProfileProps {
  token?: string;
  onNavigate?: (page: string, param?: string) => void;
}

export default function PublicProfile({ token, onNavigate }: PublicProfileProps) {

  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;

    setLoading(true);
    setError('');

    const result = await publicProfileTokenService.getProfileByToken(token);

    if (result.success && result.data) {
      setProfile(result.data);
    } else {
      setError(result.error || 'Profil introuvable ou lien expiré');
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profil non accessible
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Ce lien est invalide, expiré ou a été révoqué.'}
          </p>
          <button
            onClick={() => onNavigate?.('home')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Retour à l'accueil
          </button>
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-600 mb-3">
              Vous êtes recruteur et souhaitez accéder à plus de profils qualifiés ?
            </p>
            <button
              onClick={() => onNavigate?.('signup')}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Créer un compte recruteur sur JobGuinée
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-2">Profil partagé via</p>
              <h1 className="text-2xl font-bold">JobGuinée</h1>
            </div>
            <button
              onClick={() => onNavigate?.('home')}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium"
            >
              Retour à JobGuinée
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-orange-100 to-orange-50 px-8 py-12">
            <div className="flex items-start gap-6">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-orange-200 flex items-center justify-center shadow-lg">
                  <User className="w-16 h-16 text-orange-600" />
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.full_name}
                </h2>

                {profile.professional_title && (
                  <p className="text-xl text-gray-700 mb-4">
                    {profile.professional_title}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-gray-600">
                  {profile.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {profile.location}
                    </div>
                  )}

                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {profile.email}
                    </div>
                  )}

                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </div>
                  )}
                </div>

                {(profile.linkedin_url || profile.portfolio_url || profile.github_url) && (
                  <div className="flex gap-3 mt-4">
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}

                    {profile.portfolio_url && (
                      <a
                        href={profile.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <Globe className="w-4 h-4" />
                        Portfolio
                      </a>
                    )}

                    {profile.github_url && (
                      <a
                        href={profile.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                      >
                        <Github className="w-4 h-4" />
                        GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-8 py-6 border-t bg-blue-50">
            <div className="flex items-center gap-3 text-blue-800">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">
                <strong>Profil vérifié JobGuinée</strong> - Ce profil est hébergé sur la plateforme JobGuinée,
                première plateforme emploi & RH de Guinée.
              </p>
            </div>
          </div>
        </div>

        {profile.professional_summary && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-600" />
              Résumé professionnel
            </h3>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {profile.professional_summary}
            </p>
          </div>
        )}

        {profile.experiences && profile.experiences.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-600" />
              Expériences professionnelles
            </h3>
            <div className="space-y-6">
              {profile.experiences.map((exp: any, index: number) => (
                <div key={index} className="relative pl-8 border-l-2 border-orange-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-orange-600 rounded-full" />
                  <h4 className="font-semibold text-gray-900 text-lg">{exp.titre}</h4>
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Building2 className="w-4 h-4" />
                    <span>{exp.entreprise}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {exp.date_debut} - {exp.en_cours ? 'Présent' : exp.date_fin}
                    </span>
                    {exp.lieu && <span>• {exp.lieu}</span>}
                  </div>
                  {exp.description && (
                    <p className="text-gray-700 whitespace-pre-wrap">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.education && profile.education.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-orange-600" />
              Formation
            </h3>
            <div className="space-y-6">
              {profile.education.map((edu: any, index: number) => (
                <div key={index} className="relative pl-8 border-l-2 border-orange-200">
                  <div className="absolute -left-2 top-0 w-4 h-4 bg-orange-600 rounded-full" />
                  <h4 className="font-semibold text-gray-900 text-lg">{edu.diplome}</h4>
                  <p className="text-gray-600 mb-2">{edu.etablissement}</p>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {edu.annee_debut} - {edu.annee_fin}
                    </span>
                    {edu.lieu && <span>• {edu.lieu}</span>}
                  </div>
                  {edu.description && (
                    <p className="text-gray-700">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.skills && profile.skills.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Compétences
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill: any, index: number) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg font-medium"
                >
                  {typeof skill === 'string' ? skill : skill.nom}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.languages && profile.languages.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Languages className="w-5 h-5 text-orange-600" />
              Langues
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.languages.map((lang: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">
                    {typeof lang === 'string' ? lang : lang.langue}
                  </span>
                  {typeof lang === 'object' && lang.niveau && (
                    <span className="text-sm text-gray-600">{lang.niveau}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.certifications && profile.certifications.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-600" />
              Certifications
            </h3>
            <div className="space-y-4">
              {profile.certifications.map((cert: any, index: number) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{cert.nom}</h4>
                  {cert.organisme && (
                    <p className="text-gray-600 text-sm">{cert.organisme}</p>
                  )}
                  {cert.date_obtention && (
                    <p className="text-gray-500 text-sm">Obtenu en {cert.date_obtention}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {profile.documents && profile.documents.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              Documents
            </h3>
            <div className="space-y-3">
              {profile.documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{doc.document_name}</p>
                      <p className="text-sm text-gray-500">
                        {doc.document_type === 'cv' && 'CV'}
                        {doc.document_type === 'cover_letter' && 'Lettre de motivation'}
                        {doc.document_type === 'certificate' && 'Certificat'}
                        {!['cv', 'cover_letter', 'certificate'].includes(doc.document_type) && 'Document'}
                      </p>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-gray-400" />
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg shadow-md p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">
            Vous souhaitez accéder à plus de profils qualifiés ?
          </h3>
          <p className="text-orange-100 mb-6">
            Rejoignez JobGuinée, la première plateforme emploi & RH de Guinée,
            et accédez à notre CVthèque complète de candidats qualifiés.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onNavigate?.('signup')}
              className="px-8 py-3 bg-white text-orange-600 rounded-lg hover:bg-orange-50 font-semibold flex items-center gap-2"
            >
              Créer un compte recruteur
              <ExternalLink className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate?.('home')}
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 font-semibold"
            >
              En savoir plus
            </button>
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-8 px-4 mt-12">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            Ce profil est partagé via <strong>JobGuinée</strong> - Plateforme emploi & RH en Guinée
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © {new Date().getFullYear()} JobGuinée. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
