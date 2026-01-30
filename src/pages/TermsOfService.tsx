import { ArrowLeft, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des conditions</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              En accédant et en utilisant <strong>JobGuinée-Pro.com</strong> (la "Plateforme"), vous acceptez d'être lié
              par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser
              nos services.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-blue-900">
                <strong>Important :</strong> Ces conditions constituent un accord légal entre vous et JobGuinée-Pro.
                Veuillez les lire attentivement.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description des services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              JobGuinée-Pro est une plateforme numérique de recrutement et de services RH proposant :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
              <li>Publication et consultation d'offres d'emploi</li>
              <li>CVthèque et recherche de profils professionnels</li>
              <li>Services de formation et coaching professionnel</li>
              <li>Outils de gestion de candidatures (ATS)</li>
              <li>Services d'intelligence artificielle pour l'emploi</li>
              <li>Solutions B2B pour les entreprises</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Inscription et compte utilisateur</h2>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">3.1. Éligibilité</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pour utiliser nos services, vous devez :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Être âgé d'au moins 18 ans</li>
              <li>Avoir la capacité juridique de conclure un contrat</li>
              <li>Fournir des informations exactes et véridiques</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">3.2. Création de compte</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Lors de votre inscription, vous vous engagez à :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Fournir des informations complètes, exactes et à jour</li>
              <li>Maintenir la sécurité de votre mot de passe</li>
              <li>Informer immédiatement JobGuinée-Pro de toute utilisation non autorisée de votre compte</li>
              <li>Ne créer qu'un seul compte par personne</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">3.3. Types de comptes</h3>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Candidat</h4>
                <p className="text-sm text-gray-600">
                  Recherche d'emploi, candidatures, gestion de CV
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Recruteur</h4>
                <p className="text-sm text-gray-600">
                  Publication d'offres, recherche de candidats, ATS
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Formateur</h4>
                <p className="text-sm text-gray-600">
                  Publication de formations, coaching professionnel
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Utilisation acceptable</h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">Vous êtes autorisé à :</h3>
                  <ul className="list-disc ml-6 text-green-800 space-y-1">
                    <li>Utiliser la plateforme à des fins professionnelles légitimes</li>
                    <li>Publier des offres d'emploi conformes à la législation</li>
                    <li>Postuler à des offres d'emploi</li>
                    <li>Utiliser les services d'IA dans le cadre prévu</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-2">Il est strictement interdit de :</h3>
                  <ul className="list-disc ml-6 text-red-800 space-y-1">
                    <li>Publier des contenus discriminatoires, offensants ou illégaux</li>
                    <li>Utiliser la plateforme pour des activités frauduleuses</li>
                    <li>Collecter des données personnelles sans autorisation</li>
                    <li>Spammer ou envoyer des messages non sollicités</li>
                    <li>Contourner les mesures de sécurité de la plateforme</li>
                    <li>Créer de faux profils ou usurper l'identité d'autrui</li>
                    <li>Utiliser des robots ou scripts automatisés</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Contenu utilisateur</h2>

            <h3 className="font-semibold text-gray-900 mb-2">5.1. Responsabilité du contenu</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous êtes seul responsable du contenu que vous publiez sur la plateforme (CV, offres d'emploi, messages, etc.).
              Vous garantissez que votre contenu :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Ne viole aucun droit de propriété intellectuelle</li>
              <li>Est véridique et non trompeur</li>
              <li>Respecte la législation en vigueur</li>
              <li>Ne contient pas de virus ou de code malveillant</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">5.2. Licence accordée</h3>
            <p className="text-gray-700 leading-relaxed">
              En publiant du contenu sur JobGuinée-Pro, vous accordez à la plateforme une licence mondiale, non exclusive,
              gratuite pour utiliser, reproduire et afficher ce contenu dans le cadre de la fourniture de nos services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Services payants et crédits</h2>

            <h3 className="font-semibold text-gray-900 mb-2">6.1. Système de crédits</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Certains services sont accessibles via un système de crédits :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>Les crédits sont non remboursables sauf exception légale</li>
              <li>Les crédits ont une durée de validité spécifiée lors de l'achat</li>
              <li>Les prix peuvent être modifiés avec préavis</li>
            </ul>

            <h3 className="font-semibold text-gray-900 mb-2 mt-4">6.2. Abonnements Premium</h3>
            <p className="text-gray-700 leading-relaxed">
              Les abonnements premium sont facturés mensuellement ou annuellement. Vous pouvez annuler votre abonnement
              à tout moment, l'annulation prenant effet à la fin de la période en cours.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Propriété intellectuelle</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Tous les droits de propriété intellectuelle relatifs à la plateforme JobGuinée-Pro (marques, logos, design,
              code source, contenu) sont la propriété exclusive de JobGuinée-Pro ou de ses concédants de licence.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Toute reproduction, distribution ou utilisation non autorisée du contenu de la plateforme est strictement
              interdite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation de responsabilité</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-900 font-semibold mb-2">
                JobGuinée-Pro agit en tant qu'intermédiaire
              </p>
              <p className="text-yellow-800">
                La plateforme met en relation candidats et recruteurs mais n'est pas partie aux contrats de travail conclus.
                Nous ne garantissons pas l'exactitude des offres d'emploi ni la qualité des candidats.
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              Dans les limites autorisées par la loi :
            </p>
            <ul className="list-disc ml-6 text-gray-700 space-y-1">
              <li>JobGuinée-Pro ne peut être tenu responsable des pertes indirectes ou consécutives</li>
              <li>Notre responsabilité est limitée au montant des frais que vous avez payés au cours des 12 derniers mois</li>
              <li>Nous ne garantissons pas l'absence d'interruptions ou d'erreurs dans nos services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Résiliation</h2>

            <h3 className="font-semibold text-gray-900 mb-2">9.1. Par l'utilisateur</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.
            </p>

            <h3 className="font-semibold text-gray-900 mb-2">9.2. Par JobGuinée-Pro</h3>
            <p className="text-gray-700 leading-relaxed">
              Nous nous réservons le droit de suspendre ou de résilier votre compte en cas de violation des présentes
              conditions, sans préavis et sans remboursement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Modification des conditions</h2>
            <p className="text-gray-700 leading-relaxed">
              JobGuinée-Pro se réserve le droit de modifier ces conditions à tout moment. Les modifications seront
              effectives dès leur publication sur cette page. Votre utilisation continue de la plateforme après
              modification constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Loi applicable et juridiction</h2>
            <p className="text-gray-700 leading-relaxed">
              Les présentes conditions sont régies par les lois de la République de Guinée. En cas de litige, les tribunaux
              de Conakry seront seuls compétents.
            </p>
          </section>

          <section className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Pour toute question concernant ces conditions d'utilisation :
            </p>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-800">
                <strong>Email :</strong>
                <a href="mailto:contact@jobguinee-pro.com" className="text-blue-600 hover:underline ml-2">
                  contact@jobguinee-pro.com
                </a>
              </p>
            </div>
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
