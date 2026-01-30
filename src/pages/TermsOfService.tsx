import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Mail } from 'lucide-react';

interface TermsOfServiceProps {
  onNavigate: (page: string) => void;
}

export default function TermsOfService({ onNavigate }: TermsOfServiceProps) {
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
            <FileText className="w-12 h-12" />
            <h1 className="text-4xl font-bold">Conditions d'Utilisation</h1>
          </div>
          <p className="text-blue-100 text-lg">
            Dernière mise à jour : 30 janvier 2026
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Objet</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>JobGuinée-Pro.com</strong> (ci-après "la Plateforme") est un service numérique qui met en relation
              les candidats à la recherche d'opportunités professionnelles avec les entreprises, recruteurs et formateurs
              en République de Guinée.
            </p>
            <p className="text-gray-700 leading-relaxed">
              La Plateforme propose les services suivants :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2 mt-3">
              <li>Publication et consultation d'offres d'emploi</li>
              <li>Création et diffusion de profils professionnels (CV)</li>
              <li>Accès à une CVthèque pour les recruteurs</li>
              <li>Services de formation et coaching professionnel</li>
              <li>Outils d'intelligence artificielle pour optimiser les candidatures</li>
              <li>Solutions B2B pour accompagner les entreprises dans leurs recrutements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Acceptation des conditions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              L'utilisation de JobGuinée-Pro.com implique l'acceptation pleine et entière des présentes Conditions d'Utilisation.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser la Plateforme.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mt-4">
              <p className="text-blue-900 font-semibold">
                En créant un compte ou en naviguant sur JobGuinée-Pro.com, vous confirmez avoir lu, compris et accepté
                les présentes conditions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Accès aux services</h2>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">3.1. Création de compte</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pour accéder aux fonctionnalités de la Plateforme, vous devez créer un compte utilisateur en fournissant
              les informations suivantes :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Nom complet</li>
              <li>Adresse email valide</li>
              <li>Mot de passe sécurisé</li>
              <li>Type de profil (Candidat, Recruteur ou Formateur)</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">3.2. Accès gratuit et services payants</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              L'accès de base à JobGuinée-Pro.com est <strong>gratuit</strong> pour tous les utilisateurs.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Certains services avancés peuvent nécessiter un paiement ou l'utilisation de crédits :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1 mt-2">
              <li>Accès à la CVthèque pour les recruteurs</li>
              <li>Services d'intelligence artificielle premium</li>
              <li>Mise en avant d'offres d'emploi</li>
              <li>Abonnements entreprise</li>
            </ul>
            <p className="text-gray-600 text-sm mt-4 italic">
              Les tarifs de ces services sont indiqués sur la Plateforme avant tout paiement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Responsabilités de l'utilisateur</h2>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">4.1. Exactitude des informations</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous vous engagez à fournir des informations <strong>exactes, complètes et à jour</strong> lors de votre
              inscription et dans le cadre de votre utilisation de la Plateforme.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Vous êtes responsable de la mise à jour de vos informations personnelles et professionnelles.
            </p>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">4.2. Utilisation légale et professionnelle</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Vous vous engagez à utiliser JobGuinée-Pro.com de manière légale et professionnelle. Vous ne devez pas :
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <ul className="list-disc ml-6 text-red-800 space-y-2">
                    <li>Publier des offres d'emploi frauduleuses ou trompeuses</li>
                    <li>Diffuser des contenus discriminatoires, offensants ou illégaux</li>
                    <li>Harceler d'autres utilisateurs</li>
                    <li>Utiliser la Plateforme à des fins de spam ou de prospection abusive</li>
                    <li>Tenter d'accéder aux comptes d'autres utilisateurs</li>
                  </ul>
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">4.3. Interdiction des usages frauduleux</h3>
            <p className="text-gray-700 leading-relaxed">
              Toute utilisation frauduleuse de la Plateforme (faux profils, usurpation d'identité, arnaque, etc.)
              est strictement interdite et peut entraîner la suspension immédiate de votre compte et des poursuites judiciaires.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Responsabilités de JobGuinée-Pro.com</h2>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">5.1. Mise à disposition de la Plateforme</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              JobGuinée-Pro.com s'engage à mettre en œuvre les moyens nécessaires pour assurer le bon fonctionnement de
              la Plateforme et la sécurité des données qui lui sont confiées.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Toutefois, nous ne pouvons garantir une disponibilité de la Plateforme à 100%, notamment en cas de :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1 mt-2">
              <li>Maintenance technique planifiée ou d'urgence</li>
              <li>Problèmes techniques indépendants de notre volonté</li>
              <li>Cas de force majeure</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">5.2. Absence de garantie d'embauche</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
              <p className="text-yellow-900 font-semibold mb-2">
                JobGuinée-Pro.com est une plateforme d'intermédiation
              </p>
              <p className="text-yellow-800">
                Nous facilitons la mise en relation entre candidats et recruteurs, mais nous <strong>ne garantissons pas</strong>
                le recrutement, l'embauche ou l'obtention d'un emploi.
              </p>
              <p className="text-yellow-800 mt-2">
                Les décisions de recrutement relèvent de la seule responsabilité des entreprises et recruteurs.
              </p>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">5.3. Limitation de responsabilité</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Dans les limites autorisées par la loi, JobGuinée-Pro.com ne peut être tenu responsable :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Des contenus publiés par les utilisateurs (offres d'emploi, CV, messages)</li>
              <li>De la véracité des informations fournies par les utilisateurs</li>
              <li>Des relations contractuelles entre candidats et employeurs</li>
              <li>Des pertes de données résultant d'une utilisation non conforme de la Plateforme</li>
              <li>Des dommages indirects ou consécutifs liés à l'utilisation de nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Comptes utilisateurs</h2>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">6.1. Sécurité des identifiants</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous êtes responsable de la confidentialité de vos identifiants de connexion (email et mot de passe).
            </p>
            <p className="text-gray-700 leading-relaxed">
              Vous devez <strong>informer immédiatement</strong> JobGuinée-Pro.com en cas d'utilisation non autorisée
              de votre compte ou de toute autre atteinte à la sécurité.
            </p>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">6.2. Suspension ou suppression en cas d'abus</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              JobGuinée-Pro.com se réserve le droit de <strong>suspendre ou supprimer</strong> votre compte sans préavis
              ni indemnité dans les cas suivants :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Non-respect des présentes Conditions d'Utilisation</li>
              <li>Utilisation frauduleuse ou abusive de la Plateforme</li>
              <li>Publication de contenus illégaux ou contraires aux bonnes mœurs</li>
              <li>Comportement nuisible envers d'autres utilisateurs</li>
              <li>Inactivité prolongée du compte (plus de 3 ans)</li>
            </ul>
            <p className="text-gray-600 text-sm mt-4 italic">
              En cas de suspension, vous serez informé par email à l'adresse associée à votre compte.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              L'ensemble des éléments de la Plateforme JobGuinée-Pro.com (logo, marque, nom de domaine, design, architecture,
              code source, contenus éditoriaux, etc.) sont protégés par les droits de propriété intellectuelle et sont la
              propriété exclusive de JobGuinée-Pro.com.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments de
              la Plateforme, quel que soit le moyen ou le procédé utilisé, est <strong>strictement interdite</strong>,
              sauf autorisation écrite préalable de JobGuinée-Pro.com.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Les utilisateurs conservent la propriété intellectuelle des contenus qu'ils publient sur la Plateforme
              (CV, offres d'emploi, etc.), mais accordent à JobGuinée-Pro.com une licence d'utilisation gratuite et
              non exclusive de ces contenus dans le cadre de la fourniture des services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Données personnelles</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              La collecte, le traitement et l'utilisation de vos données personnelles sont régis par notre
              <button
                onClick={() => onNavigate('privacy-policy')}
                className="text-blue-600 hover:text-blue-800 underline font-semibold ml-1"
              >
                Politique de Confidentialité
              </button>.
            </p>
            <p className="text-gray-700 leading-relaxed">
              En utilisant JobGuinée-Pro.com, vous acceptez que vos données personnelles soient collectées et traitées
              conformément à notre Politique de Confidentialité.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-blue-900">
                <strong>Nous nous engageons à :</strong>
              </p>
              <ul className="list-disc ml-6 text-blue-800 space-y-1 mt-2">
                <li>Protéger la confidentialité de vos données personnelles</li>
                <li>Ne jamais vendre vos données à des tiers</li>
                <li>Vous permettre d'exercer vos droits (accès, modification, suppression)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Droit applicable</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Les présentes Conditions d'Utilisation sont régies par le <strong>droit de la République de Guinée</strong>.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              En cas de litige relatif à l'interprétation ou à l'exécution des présentes conditions, et à défaut de règlement
              amiable, les tribunaux de <strong>Conakry, Guinée</strong> seront seuls compétents.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-800">
                <strong>Règlement amiable :</strong> En cas de différend, nous vous invitons à nous contacter en priorité
                à l'adresse <a href="mailto:contact@jobguinee-pro.com" className="text-blue-600 hover:underline">
                contact@jobguinee-pro.com</a> afin de rechercher une solution amiable.
              </p>
            </div>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">10. Contact</h2>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pour toute question, réclamation ou demande d'information concernant les présentes Conditions d'Utilisation,
              vous pouvez nous contacter :
            </p>
            <div className="bg-white rounded-lg p-4 space-y-2">
              <p className="text-gray-800">
                <strong>Email officiel :</strong>
                <a href="mailto:contact@jobguinee-pro.com" className="text-blue-600 hover:underline ml-2">
                  contact@jobguinee-pro.com
                </a>
              </p>
              <p className="text-gray-800">
                <strong>Site web :</strong>
                <a href="https://jobguinee-pro.com" className="text-blue-600 hover:underline ml-2" target="_blank" rel="noopener noreferrer">
                  www.jobguinee-pro.com
                </a>
              </p>
              <p className="text-gray-800">
                <strong>Siège :</strong> Conakry, République de Guinée
              </p>
            </div>
            <p className="text-gray-600 mt-4 text-sm">
              Nous nous efforçons de répondre à toutes les demandes dans un délai de 48 heures ouvrables.
            </p>
          </section>

          <div className="border-t border-gray-200 pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              En utilisant JobGuinée-Pro.com, vous acceptez ces conditions d'utilisation.
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
