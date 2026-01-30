import { ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Mail } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigate: (page: string) => void;
}

export default function PrivacyPolicy({ onNavigate }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </button>
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Politique de Confidentialité</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Dernière mise à jour : 30 janvier 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>JobGuinée-Pro.com</strong> (ci-après "JobGuinée-Pro", "nous", "notre") est une plateforme numérique
              de recrutement et de services en ressources humaines opérant principalement en République de Guinée.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Nous nous engageons à protéger la confidentialité et la sécurité des données personnelles de nos utilisateurs.
              Cette politique de confidentialité décrit comment nous collectons, utilisons, partageons et protégeons vos
              informations personnelles lorsque vous utilisez nos services.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Données collectées</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Dans le cadre de la fourniture de nos services, nous collectons les types de données suivants :
            </p>

            <div className="space-y-4 ml-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.1. Informations d'identification</h3>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  <li>Nom complet (prénom et nom de famille)</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone (optionnel)</li>
                  <li>Photo de profil (optionnelle)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.2. Informations professionnelles</h3>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  <li>CV et documents de candidature</li>
                  <li>Expériences professionnelles</li>
                  <li>Formation et diplômes</li>
                  <li>Compétences et certifications</li>
                  <li>Préférences de recherche d'emploi</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.3. Données de connexion et d'authentification</h3>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  <li>Identifiants de compte</li>
                  <li>Données d'authentification Google OAuth (si utilisé)</li>
                  <li>Historique de connexion</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2.4. Données techniques</h3>
                <ul className="list-disc ml-6 text-gray-700 space-y-1">
                  <li>Adresse IP</li>
                  <li>Type de navigateur et version</li>
                  <li>Système d'exploitation</li>
                  <li>Pages visitées et interactions sur la plateforme</li>
                  <li>Date et heure d'accès</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">3. Finalité de la collecte</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous collectons et utilisons vos données personnelles pour les finalités suivantes :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li><strong>Création et gestion de compte :</strong> Permettre votre inscription et la gestion de votre profil utilisateur</li>
              <li><strong>Authentification et sécurité :</strong> Vérifier votre identité et sécuriser votre accès à nos services</li>
              <li><strong>Mise en relation professionnelle :</strong> Faciliter la connexion entre candidats, recruteurs et formateurs</li>
              <li><strong>Communication :</strong> Vous envoyer des notifications relatives à votre compte, vos candidatures et les opportunités d'emploi</li>
              <li><strong>Amélioration des services :</strong> Analyser l'utilisation de la plateforme pour améliorer l'expérience utilisateur</li>
              <li><strong>Support client :</strong> Répondre à vos questions et résoudre les problèmes techniques</li>
              <li><strong>Conformité légale :</strong> Respecter nos obligations légales et réglementaires</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath fill='%234285F4' d='M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z'/%3E%3Cpath fill='%2334A853' d='M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z'/%3E%3Cpath fill='%23FBBC05' d='M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z'/%3E%3Cpath fill='%23EA4335' d='M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z'/%3E%3C/svg%3E"
                alt="Google"
                className="w-6 h-6"
              />
              <h2 className="text-2xl font-bold text-gray-900">4. Utilisation de Google OAuth</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              JobGuinée-Pro propose une option de connexion via <strong>Google OAuth</strong> pour simplifier l'inscription
              et l'authentification des utilisateurs.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-2">Données récupérées via Google OAuth :</h3>
              <ul className="list-disc ml-6 text-blue-800 space-y-1">
                <li>Adresse email associée à votre compte Google</li>
                <li>Nom complet (prénom et nom)</li>
                <li>Photo de profil Google (si disponible)</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold mb-2">
                Important : Nous n'avons jamais accès à votre mot de passe Google
              </p>
              <p className="text-green-700">
                L'authentification Google OAuth ne nous donne aucun accès à vos identifiants de connexion Google.
                Seules les informations de profil public mentionnées ci-dessus sont partagées avec notre plateforme,
                et uniquement avec votre consentement explicite.
              </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">5. Partage des données</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Nous ne vendons jamais vos données personnelles à des tiers.</strong>
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vos données peuvent être partagées uniquement dans les cas suivants :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>
                <strong>Avec les recruteurs :</strong> Si vous postulez à une offre d'emploi, vos informations de candidature
                (CV, lettre de motivation, coordonnées) sont transmises au recruteur concerné.
              </li>
              <li>
                <strong>Prestataires techniques :</strong> Nous utilisons des prestataires de services tiers pour l'hébergement
                (Supabase), l'authentification (Google OAuth) et l'envoi d'emails. Ces prestataires ont accès uniquement aux
                données nécessaires à la fourniture de leurs services et sont tenus de les protéger.
              </li>
              <li>
                <strong>Obligations légales :</strong> Nous pouvons divulguer vos données si la loi l'exige ou en réponse à
                une demande légale valide.
              </li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">6. Sécurité des données</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données
              personnelles contre tout accès non autorisé, toute perte, destruction ou altération :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Chiffrement des données en transit (HTTPS/SSL)</li>
              <li>Chiffrement des mots de passe (hachage sécurisé)</li>
              <li>Accès restreint aux données par des employés autorisés uniquement</li>
              <li>Infrastructure d'hébergement sécurisée (Supabase)</li>
              <li>Surveillance et journalisation des accès</li>
            </ul>
            <p className="text-gray-600 italic mt-4">
              Aucun système n'est totalement infaillible. Bien que nous mettions tout en œuvre pour protéger vos données,
              nous ne pouvons garantir une sécurité absolue.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Droits des utilisateurs</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous disposez des droits suivants concernant vos données personnelles :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>
                <strong>Droit d'accès :</strong> Vous pouvez demander une copie des données personnelles que nous détenons
                sur vous.
              </li>
              <li>
                <strong>Droit de rectification :</strong> Vous pouvez modifier et mettre à jour vos informations de profil
                directement depuis votre compte.
              </li>
              <li>
                <strong>Droit à l'effacement :</strong> Vous pouvez demander la suppression de votre compte et de vos données
                personnelles. Certaines données peuvent être conservées pour des raisons légales ou de sécurité.
              </li>
              <li>
                <strong>Droit d'opposition :</strong> Vous pouvez vous opposer à certains traitements de vos données,
                notamment à des fins de marketing.
              </li>
              <li>
                <strong>Droit à la portabilité :</strong> Vous pouvez demander à recevoir vos données dans un format
                structuré et couramment utilisé.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Pour exercer ces droits, veuillez nous contacter à l'adresse :
              <a href="mailto:contact@jobguinee-pro.com" className="text-blue-600 hover:underline ml-1">
                contact@jobguinee-pro.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Durée de conservation</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Nous conservons vos données personnelles uniquement pendant la durée nécessaire aux finalités pour lesquelles
              elles ont été collectées :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>
                <strong>Compte actif :</strong> Tant que votre compte est actif et que vous utilisez nos services.
              </li>
              <li>
                <strong>Compte inactif :</strong> Les comptes inactifs depuis plus de 3 ans peuvent être supprimés après
                notification préalable.
              </li>
              <li>
                <strong>Après suppression du compte :</strong> Certaines données peuvent être conservées pendant une durée
                limitée pour des raisons légales, comptables ou de sécurité (généralement 1 an maximum).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Cookies et technologies similaires</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              JobGuinée-Pro utilise des cookies et des technologies similaires pour améliorer votre expérience utilisateur :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement de la plateforme (session, authentification)</li>
              <li><strong>Cookies de préférence :</strong> Mémorisation de vos choix (langue, paramètres)</li>
              <li><strong>Cookies analytiques :</strong> Analyse de l'utilisation de la plateforme pour l'améliorer</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités de la
              plateforme peuvent être limitées.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modifications de la politique</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification
              sera publiée sur cette page avec une date de mise à jour actualisée. Nous vous encourageons à consulter
              régulièrement cette page pour rester informé de nos pratiques en matière de protection des données.
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              En cas de modification substantielle, nous vous informerons par email ou via une notification sur la plateforme.
            </p>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">11. Contact</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
              vous pouvez nous contacter :
            </p>
            <div className="bg-white rounded-lg p-4 space-y-2">
              <p className="text-gray-800">
                <strong>Email :</strong>
                <a href="mailto:contact@jobguinee-pro.com" className="text-blue-600 hover:underline ml-2">
                  contact@jobguinee-pro.com
                </a>
              </p>
              <p className="text-gray-800">
                <strong>Plateforme :</strong>
                <a href="https://jobguinee-pro.com" className="text-blue-600 hover:underline ml-2" target="_blank" rel="noopener noreferrer">
                  www.jobguinee-pro.com
                </a>
              </p>
              <p className="text-gray-800">
                <strong>Pays d'exploitation :</strong> République de Guinée
              </p>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              Nous nous engageons à répondre à vos demandes dans les meilleurs délais, généralement sous 30 jours.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              En utilisant JobGuinée-Pro.com, vous acceptez les termes de cette politique de confidentialité.
            </p>
            <p className="text-sm text-gray-500 text-center mt-2">
              Dernière mise à jour : 30 janvier 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
