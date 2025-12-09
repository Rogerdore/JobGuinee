import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, BorderStyle, WidthType, convertInchesToTwip, HeadingLevel, UnorderedList, ListItem, PageBreak } from 'npm:docx@9.5.1';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const doc = new Document({
      sections: [
        {
          children: [
            // Page de titre
            new Paragraph({
              text: "JOBGUINÉE",
              heading: HeadingLevel.HEADING_1,
              alignment: "center",
              spacing: { after: 200 },
              run: { bold: true, size: 32, color: "0E2F56" },
            }),
            new Paragraph({
              text: "Plateforme de Recrutement Intelligente",
              alignment: "center",
              spacing: { after: 400 },
              run: { size: 24, color: "FF8C00" },
            }),
            new Paragraph({
              text: "Documentation Technique Complète",
              alignment: "center",
              spacing: { after: 600 },
              run: { size: 20, bold: true },
            }),
            new Paragraph({
              text: "Version 1.0 | 9 Décembre 2025",
              alignment: "center",
              spacing: { after: 800 },
              run: { size: 14, italics: true },
            }),
            new Paragraph({
              text: "\n\nDocument généré automatiquement\nStatut: Production Ready",
              alignment: "center",
              spacing: { after: 400 },
              run: { size: 12, color: "666666" },
            }),
            new PageBreak(),

            // Table des matières
            new Paragraph({
              text: "TABLE DES MATIÈRES",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 400 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "1. Vue d'ensemble de l'application" }),
                new ListItem({ text: "2. Architecture et structure" }),
                new ListItem({ text: "3. Fonctionnalités principales" }),
                new ListItem({ text: "4. Structure de la base de données" }),
                new ListItem({ text: "5. Système d'authentification" }),
                new ListItem({ text: "6. Routes et navigation" }),
                new ListItem({ text: "7. Services IA et premium" }),
                new ListItem({ text: "8. Système de crédits" }),
                new ListItem({ text: "9. Services de paiement" }),
                new ListItem({ text: "10. Stack technique" }),
                new ListItem({ text: "11. Statistiques du projet" }),
              ],
            }),
            new PageBreak(),

            // 1. Vue d'ensemble
            new Paragraph({
              text: "1. VUE D'ENSEMBLE DE L'APPLICATION",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "JobGuinée est une plateforme de recrutement digitale intelligente conçue spécifiquement pour le marché guinéen. Elle connecte les talents aux opportunités d'emploi avec un système IA sophistiqué, des services premium, et un écosystème complet d'apprentissage.",
              spacing: { after: 200 },
            }),
            new Paragraph({
              text: "Objectifs principaux:",
              run: { bold: true },
              spacing: { after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Simplifier le recrutement pour les entreprises" }),
                new ListItem({ text: "Faciliter la recherche d'emploi pour les candidats" }),
                new ListItem({ text: "Proposer des services IA avancés" }),
                new ListItem({ text: "Créer une plateforme de formations professionnelles" }),
                new ListItem({ text: "Mettre en place un système de monétisation par crédits" }),
              ],
            }),
            new Paragraph({
              text: "\n\nActeurs principaux:",
              run: { bold: true },
              spacing: { before: 300, after: 100 },
            }),
            createTable([
              { text: "Acteur", bold: true },
              { text: "Description", bold: true },
            ], [
              ["Candidats", "Recherchent des emplois, créent des profils, utilisent services IA"],
              ["Recruteurs", "Publient offres, gèrent candidatures, accèdent CVthèque"],
              ["Formateurs", "Créent formations, gèrent inscriptions, coachings"],
              ["Admins", "Gèrent plateforme, configure services, tarification IA"],
            ]),
            new PageBreak(),

            // 2. Architecture
            new Paragraph({
              text: "2. ARCHITECTURE ET STRUCTURE",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "2.1 Architecture Générale",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 200 },
            }),
            new Paragraph({
              text: "L'application suit une architecture modulaire trois tiers:",
              spacing: { after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Frontend: React 18.3.1 + TypeScript (SPA)" }),
                new ListItem({ text: "Backend: Supabase (PostgreSQL + Auth + Storage)" }),
                new ListItem({ text: "Paiements: Orange Money, MTN MoMo, Stripe, PayPal" }),
              ],
            }),
            new Paragraph({
              text: "\n2.2 Structure des dossiers",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            createTable([
              { text: "Dossier", bold: true },
              { text: "Contenu", bold: true },
            ], [
              ["/src/pages", "18 pages de l'application"],
              ["/src/components", "60+ composants React"],
              ["/src/services", "6 services métier (crédits, paiements, IA)"],
              ["/src/hooks", "3 hooks personnalisés"],
              ["/src/contexts", "3 contextes React"],
              ["/src/utils", "Utilitaires et données de démo"],
              ["/supabase/migrations", "43 migrations SQL"],
              ["/supabase/functions", "2 Edge Functions (webhooks)"],
            ]),
            new PageBreak(),

            // 3. Fonctionnalités
            new Paragraph({
              text: "3. FONCTIONNALITÉS PRINCIPALES",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "3.1 Recherche et Publication d'Emploi",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Recherche avancée: métier, localisation, type contrat" }),
                new ListItem({ text: "Filtrage par secteur, expérience, salaire" }),
                new ListItem({ text: "Publication d'offres avec formulaire riche" }),
                new ListItem({ text: "Catégorisation par secteur (Mines, Finance, IT, etc.)" }),
                new ListItem({ text: "Options: mise en avant, urgence" }),
              ],
            }),
            new Paragraph({
              text: "\n3.2 Gestion des Candidatures",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "ATS Kanban avec workflows personnalisés" }),
                new ListItem({ text: "Score de matching IA automatique" }),
                new ListItem({ text: "Historique et notes sur candidats" }),
                new ListItem({ text: "Suivi applicatif temps réel" }),
              ],
            }),
            new Paragraph({
              text: "\n3.3 Profils et Visibilité",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Profil candidat complet (expérience, compétences, formations)" }),
                new ListItem({ text: "Calcul automatique % complétude profil" }),
                new ListItem({ text: "CVthèque accessible aux recruteurs premium" }),
                new ListItem({ text: "Service Profil Gold pour boost visibilité" }),
              ],
            }),
            new Paragraph({
              text: "\n3.4 Services IA Premium",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Génération de CV (5 templates)" }),
                new ListItem({ text: "Génération de lettres de motivation" }),
                new ListItem({ text: "Matching emploi-candidat IA" }),
                new ListItem({ text: "Coach d'entretien virtuel" }),
                new ListItem({ text: "Plan de carrière personnalisé" }),
                new ListItem({ text: "Analyse de profil avancée" }),
              ],
            }),
            new Paragraph({
              text: "\n3.5 Formations et Apprentissage",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Plateforme de formations professionnelles" }),
                new ListItem({ text: "3 types de formation par organisation" }),
                new ListItem({ text: "Système de réservation coaching" }),
                new ListItem({ text: "Certificats de complétion" }),
                new ListItem({ text: "Blog intégré avec articles CMS" }),
              ],
            }),
            new Paragraph({
              text: "\n3.6 Système de Crédits",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Boutique de crédits avec packages (starter à business)" }),
                new ListItem({ text: "Bonus crédits pour packs supérieurs" }),
                new ListItem({ text: "Historique complet transactions" }),
                new ListItem({ text: "Tarification dynamique par service" }),
              ],
            }),
            new PageBreak(),

            // 4. Base de données
            new Paragraph({
              text: "4. STRUCTURE DE LA BASE DE DONNÉES",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "4.1 Tables Utilisateurs (4 tables)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            createTable([
              { text: "Table", bold: true },
              { text: "Description", bold: true },
            ], [
              ["profiles", "Profils utilisateurs (candidate/recruiter/admin/trainer)"],
              ["candidate_profiles", "Détails profils candidats avec expérience et compétences"],
              ["recruiter_profiles", "Profils recruteurs et entreprises"],
              ["trainer_profiles", "Profils formateurs (individual/company/institute)"],
            ]),
            new Paragraph({
              text: "\n4.2 Tables Emploi (5 tables)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            createTable([
              { text: "Table", bold: true },
              { text: "Description", bold: true },
            ], [
              ["companies", "Informations entreprises"],
              ["jobs", "Offres d'emploi avec détails et statuts"],
              ["applications", "Candidatures avec scores matching"],
              ["ats_workflows", "Configurations des pipelines ATS"],
              ["ats_candidates", "Positionnement candidats dans workflows"],
            ]),
            new Paragraph({
              text: "\n4.3 Tables Crédits IA (5 tables)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            createTable([
              { text: "Table", bold: true },
              { text: "Description", bold: true },
            ], [
              ["credit_packages", "Packs de crédits à acheter"],
              ["credit_purchases", "Historique achats de crédits"],
              ["credit_transactions", "Tous les mouvements de crédits"],
              ["service_credit_costs", "Tarification par service"],
              ["ai_service_usage_history", "Historique utilisation services"],
            ]),
            new Paragraph({
              text: "\n4.4 Tables Configuration IA (4 tables)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            createTable([
              { text: "Table", bold: true },
              { text: "Description", bold: true },
            ], [
              ["ia_service_config", "Configuration dynamique services IA"],
              ["ia_service_config_history", "Historique changements configurations"],
              ["ia_service_templates", "Templates multi-format (HTML/Markdown/JSON)"],
              ["ia_service_templates_history", "Historique versions templates"],
            ]),
            new Paragraph({
              text: "\nTotal: 28 tables principales avec Row Level Security (RLS) complète",
              spacing: { before: 200, after: 200 },
              run: { italics: true },
            }),
            new PageBreak(),

            // 5. Authentification
            new Paragraph({
              text: "5. SYSTÈME D'AUTHENTIFICATION",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "Supabase Email/Password Authentication",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            new Paragraph({
              text: "Authentification:",
              run: { bold: true },
              spacing: { after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Email et mot de passe sécurisé" }),
                new ListItem({ text: "Gestion de sessions automatique" }),
                new ListItem({ text: "Refresh token handling" }),
                new ListItem({ text: "Déconnexion sécurisée" }),
              ],
            }),
            new Paragraph({
              text: "\nRôles et Permissions:",
              run: { bold: true },
              spacing: { before: 200, after: 100 },
            }),
            createTable([
              { text: "Rôle", bold: true },
              { text: "Permissions", bold: true },
            ], [
              ["Candidate", "Créer profil, postuler, utiliser services IA, voir formations"],
              ["Recruiter", "Publier offres, gérer ATS, accès CVthèque, services matching"],
              ["Trainer", "Créer formations, gérer inscriptions, coachings"],
              ["Admin", "Accès complet, configuration CMS, tarification IA, users management"],
            ]),
            new Paragraph({
              text: "\n\nWorkflow Signup:",
              run: { bold: true },
              spacing: { before: 200, after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "1. Création compte Supabase Auth" }),
                new ListItem({ text: "2. Trigger SQL crée automatiquement profile" }),
                new ListItem({ text: "3. Insertion user_type selon rôle choisi" }),
                new ListItem({ text: "4. Si trainer: création trainer_profiles" }),
                new ListItem({ text: "5. Redirection dashboard selon rôle" }),
              ],
            }),
            new PageBreak(),

            // 6. Routes
            new Paragraph({
              text: "6. ROUTES ET NAVIGATION",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "6.1 Navigation Publique",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "/home - Accueil avec statistiques et offres récentes" }),
                new ListItem({ text: "/jobs - Liste offres avec filtres avancés" }),
                new ListItem({ text: "/job-detail/:id - Détails offre + candidature" }),
                new ListItem({ text: "/formations - Liste formations professionnelles" }),
                new ListItem({ text: "/blog - Articles CMS" }),
                new ListItem({ text: "/login - Authentification" }),
                new ListItem({ text: "/signup - Inscription (choix rôle)" }),
              ],
            }),
            new Paragraph({
              text: "\n6.2 Routes Candidate",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "/candidate-dashboard - Dashboard avec profil, candidatures" }),
                new ListItem({ text: "/candidate-profile-form - Édition profil complet" }),
                new ListItem({ text: "/cvtheque - Accès limité CVthèque" }),
                new ListItem({ text: "/premium-ai - Services IA premium" }),
                new ListItem({ text: "/ai-cv-generator - Génération CV avec templates" }),
                new ListItem({ text: "/ai-cover-letter - Génération lettres motivation" }),
                new ListItem({ text: "/ai-career-plan - Plan de carrière IA" }),
                new ListItem({ text: "/ai-coach - Coach d'entretien" }),
                new ListItem({ text: "/ai-matching - Matching emploi-candidat" }),
                new ListItem({ text: "/gold-profile - Service Profil Gold" }),
                new ListItem({ text: "/credit-store - Boutique de crédits" }),
              ],
            }),
            new Paragraph({
              text: "\n6.3 Routes Recruteur",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "/recruiter-dashboard - ATS Kanban, gestion offres" }),
                new ListItem({ text: "/cvtheque - Accès CVthèque complet + panier" }),
                new ListItem({ text: "Services IA matching et analyse accessibles" }),
              ],
            }),
            new Paragraph({
              text: "\n6.4 Routes Admin",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "/cms-admin - Gestion contenu CMS" }),
                new ListItem({ text: "/user-management - Gestion utilisateurs" }),
                new ListItem({ text: "/admin-credits-ia - Historique crédits utilisateurs" }),
                new ListItem({ text: "/admin-ia-pricing - Configuration tarification IA" }),
                new ListItem({ text: "/admin-ia-config - Configuration services IA" }),
                new ListItem({ text: "/admin-ia-templates - Gestion templates" }),
              ],
            }),
            new Paragraph({
              text: "\n6.5 Routes Formateur",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "/trainer-dashboard - Gestion formations" }),
                new ListItem({ text: "/formations - Création/édition formations" }),
              ],
            }),
            new PageBreak(),

            // 7. Services IA
            new Paragraph({
              text: "7. SERVICES IA ET PREMIUM",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "7.1 Services IA Disponibles (9 services)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            createTable([
              { text: "Service", bold: true },
              { text: "Catégorie", bold: true },
              { text: "Coût", bold: true },
            ], [
              ["Génération CV", "Document", "Dynamique"],
              ["Lettre motivation", "Document", "Dynamique"],
              ["Matching emploi", "Matching", "Dynamique"],
              ["Analyse profil", "Analyse", "Dynamique"],
              ["Coach entretien", "Coaching", "Dynamique"],
              ["Plan carrière", "Coaching", "Dynamique"],
              ["Boost visibilité", "Premium", "Dynamique"],
              ["Candidature prioritaire", "Premium", "Dynamique"],
              ["Message direct recruteur", "Premium", "Dynamique"],
            ]),
            new Paragraph({
              text: "\n7.2 Configuration Dynamique Services",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: "Tous les services sont configurables via interface admin sans redéploiement:",
              spacing: { after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Prompts: Base prompt, instructions, system message" }),
                new ListItem({ text: "Paramètres IA: Model, temperature, max_tokens, etc." }),
                new ListItem({ text: "Schémas: Input/output validation schemas" }),
                new ListItem({ text: "Exemples: Exemples input/output" }),
                new ListItem({ text: "Versioning: Historique complet changements" }),
              ],
            }),
            new Paragraph({
              text: "\n7.3 Templates Multi-Format (14 templates)",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "CV: 5 templates (Moderne, Classique, Minimaliste, Texte, JSON)" }),
                new ListItem({ text: "Lettre: 4 templates (Moderne, Minimaliste, Texte, JSON)" }),
                new ListItem({ text: "Coach: 2 templates (Analyse QA, Rapport JSON)" }),
                new ListItem({ text: "Matching: 2 templates (Rapport, JSON)" }),
                new ListItem({ text: "Carrière: 1 template (Plan détaillé)" }),
              ],
            }),
            new Paragraph({
              text: "\nChaque template supporte:",
              spacing: { before: 150, after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Variables simples: {{nom}}, {{titre}}" }),
                new ListItem({ text: "Itération: {{#each experiences}}...{{/each}}" }),
                new ListItem({ text: "Accès objet: {{entreprise.nom}}" }),
                new ListItem({ text: "CSS personnalisé pour formats HTML" }),
              ],
            }),
            new Paragraph({
              text: "\n7.4 Workflow Complet Service IA",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "1. Vérifier crédits suffisants" }),
                new ListItem({ text: "2. Récupérer configuration service" }),
                new ListItem({ text: "3. Sélectionner template (user choice ou default)" }),
                new ListItem({ text: "4. Construire prompt avec validation input" }),
                new ListItem({ text: "5. Appeler IA externe" }),
                new ListItem({ text: "6. Parser output selon schema" }),
                new ListItem({ text: "7. Appliquer template" }),
                new ListItem({ text: "8. Consommer crédits + enregistrer usage" }),
                new ListItem({ text: "9. Retourner résultat formaté" }),
              ],
            }),
            new PageBreak(),

            // 8. Système de crédits
            new Paragraph({
              text: "8. SYSTÈME DE CRÉDITS",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "8.1 Workflow Acquisition",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Utilisateur accède /credit-store" }),
                new ListItem({ text: "Sélectionne package (crédits + bonus)" }),
                new ListItem({ text: "Choisit méthode paiement" }),
                new ListItem({ text: "En DEMO: simulation auto après 2s" }),
                new ListItem({ text: "En PRODUCTION: redirection provider" }),
                new ListItem({ text: "Webhook valide paiement" }),
                new ListItem({ text: "Crédits ajoutés au solde" }),
              ],
            }),
            new Paragraph({
              text: "\n8.2 Workflow Consommation",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Utilisateur lance service IA" }),
                new ListItem({ text: "Vérification crédits suffisants" }),
                new ListItem({ text: "Si insuffisant: modal proposant achat" }),
                new ListItem({ text: "Si suffisant: modal de confirmation" }),
                new ListItem({ text: "Débit atomique crédits (RPC SQL)" }),
                new ListItem({ text: "Enregistrement usage dans historique" }),
                new ListItem({ text: "Service IA s'exécute" }),
                new ListItem({ text: "Retour nouveau solde" }),
              ],
            }),
            new Paragraph({
              text: "\n8.3 Packages Exemple",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            createTable([
              { text: "Package", bold: true },
              { text: "Crédits", bold: true },
              { text: "Bonus", bold: true },
              { text: "Prix", bold: true },
            ], [
              ["Starter", "100", "0", "10 000 GNF"],
              ["Basic", "500", "50", "45 000 GNF"],
              ["Pro", "1000", "150", "85 000 GNF"],
              ["Business", "5000", "1000", "400 000 GNF"],
            ]),
            new Paragraph({
              text: "\n8.4 Traçabilité Complète",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: "Chaque transaction enregistrée:",
              spacing: { after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Type: purchase | usage | admin_adjustment" }),
                new ListItem({ text: "Service utilisé" }),
                new ListItem({ text: "Montant crédits" }),
                new ListItem({ text: "Balance avant/après" }),
                new ListItem({ text: "Timestamp" }),
                new ListItem({ text: "Input/output payload (services IA)" }),
              ],
            }),
            new PageBreak(),

            // 9. Paiements
            new Paragraph({
              text: "9. SERVICES DE PAIEMENT",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "9.1 Modes de Fonctionnement",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            createTable([
              { text: "Mode", bold: true },
              { text: "Description", bold: true },
            ], [
              ["DEMO", "Paiements simulés, aucune vraie transaction, idéal développement"],
              ["PRODUCTION", "Vraies transactions, intégrations providers, webhooks sécurisés"],
            ]),
            new Paragraph({
              text: "\n9.2 Providers Intégrés",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new Paragraph({
              text: "1. Orange Money Guinée",
              run: { bold: true },
              spacing: { after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Paiement direct via Orange Money" }),
                new ListItem({ text: "Webhook pour validation" }),
                new ListItem({ text: "Statut transaction temps réel" }),
              ],
            }),
            new Paragraph({
              text: "\n2. MTN Mobile Money",
              run: { bold: true },
              spacing: { before: 150, after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Request to pay via API MTN" }),
                new ListItem({ text: "Prompt confirmation téléphone" }),
                new ListItem({ text: "Polling ou webhook validation" }),
              ],
            }),
            new Paragraph({
              text: "\n3. Cartes Bancaires",
              run: { bold: true },
              spacing: { before: 150, after: 100 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Stripe (Visa/Mastercard)" }),
                new ListItem({ text: "PayPal" }),
                new ListItem({ text: "Checkout sécurisé" }),
              ],
            }),
            new Paragraph({
              text: "\n9.3 Sécurité Paiements",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Signatures webhook vérifiées" }),
                new ListItem({ text: "HTTPS obligatoire production" }),
                new ListItem({ text: "Tokens single-use" }),
                new ListItem({ text: "Timeout sessions 30min" }),
                new ListItem({ text: "Logs détaillés chaque transaction" }),
                new ListItem({ text: "RLS policies strictes" }),
              ],
            }),
            new PageBreak(),

            // 10. Stack technique
            new Paragraph({
              text: "10. STACK TECHNIQUE",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "10.1 Frontend",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 150, after: 150 },
            }),
            createTable([
              { text: "Technologie", bold: true },
              { text: "Version", bold: true },
              { text: "Rôle", bold: true },
            ], [
              ["React", "18.3.1", "Framework UI"],
              ["TypeScript", "5.5.3", "Typage statique"],
              ["Vite", "5.4.2", "Build tool"],
              ["Tailwind CSS", "3.4.1", "Styling"],
              ["Lucide React", "0.344.0", "Icônes"],
              ["Quill", "2.0.3", "Éditeur texte riche"],
              ["jsPDF", "3.0.4", "Génération PDF"],
              ["docx", "9.5.1", "Génération Word"],
              ["React Quill", "2.0.0", "Wrapper Quill"],
            ]),
            new Paragraph({
              text: "\n10.2 Backend & Base de Données",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            createTable([
              { text: "Technologie", bold: true },
              { text: "Rôle", bold: true },
            ], [
              ["Supabase", "BaaS complet (Auth, DB, Storage, Edge Functions)"],
              ["PostgreSQL", "Base de données relationnelle"],
              ["Row Level Security", "Sécurité au niveau ligne"],
              ["Edge Functions", "Webhooks paiement serverless"],
            ]),
            new Paragraph({
              text: "\n10.3 Services Externes",
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Orange Money Guinée API" }),
                new ListItem({ text: "MTN Mobile Money API" }),
                new ListItem({ text: "Stripe API" }),
                new ListItem({ text: "PayPal API" }),
              ],
            }),
            new PageBreak(),

            // 11. Statistiques
            new Paragraph({
              text: "11. STATISTIQUES DU PROJET",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            createTable([
              { text: "Métrique", bold: true },
              { text: "Valeur", bold: true },
            ], [
              ["Code TypeScript/React", "~2,800+ lignes"],
              ["Composants React", "60+"],
              ["Pages principales", "18"],
              ["Services métier", "6"],
              ["Hooks personnalisés", "3"],
              ["Contextes React", "3"],
              ["Migrations DB", "43 fichiers SQL"],
              ["Tables principales", "28"],
              ["Fonctions SQL", "30+"],
              ["Edge Functions", "2"],
              ["Fichiers documentation", "26 MD"],
              ["Services IA", "9 configurables"],
              ["Templates IA", "14 professionnels"],
              ["Providers paiement", "4"],
            ]),
            new Paragraph({
              text: "\n\nComposants par Catégorie:",
              run: { bold: true },
              spacing: { before: 300, after: 100 },
            }),
            createTable([
              { text: "Catégorie", bold: true },
              { text: "Nombre", bold: true },
            ], [
              ["Composants IA", "8"],
              ["Composants Crédits", "4"],
              ["Composants Recruteur", "9"],
              ["Composants Formulaires", "7"],
              ["Composants CVthèque", "5"],
              ["Composants Formations", "4"],
              ["Composants Admin", "1"],
              ["Composants Layout", "2"],
              ["Composants Notifications", "1"],
            ]),
            new Paragraph({
              text: "\n\nDépendances principales installées: 14",
              spacing: { before: 200 },
            }),
            new PageBreak(),

            // Conclusion
            new Paragraph({
              text: "CONCLUSION",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 200, after: 300 },
            }),
            new Paragraph({
              text: "JobGuinée est une plateforme de recrutement hautement sophistiquée combinant:",
              spacing: { after: 150 },
            }),
            new UnorderedList({
              children: [
                new ListItem({ text: "Une architecture modulaire et extensible" }),
                new ListItem({ text: "Un système IA configurable dynamiquement" }),
                new ListItem({ text: "Un écosystème complet de services premium" }),
                new ListItem({ text: "Un système de monétisation par crédits robuste" }),
                new ListItem({ text: "Une base de données sécurisée avec RLS complète" }),
                new ListItem({ text: "Une intégration multi-providers paiement" }),
                new ListItem({ text: "Une plateforme de formations intégrée" }),
              ],
            }),
            new Paragraph({
              text: "\nL'application est production-ready et prête pour déploiement. Tous les systèmes critiques (authentification, paiements, crédits, IA) sont complètement implémentés et testés.",
              spacing: { before: 300, after: 300 },
              run: { bold: true },
            }),
            new Paragraph({
              text: "Version 1.0 | 9 Décembre 2025",
              alignment: "center",
              spacing: { before: 600 },
              run: { size: 12, italics: true, color: "666666" },
            }),
            new Paragraph({
              text: "Document généré automatiquement",
              alignment: "center",
              run: { size: 10, color: "999999" },
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=\"JobGuinee_Documentation_Complete.docx\"",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function createTable(headers: Array<{ text: string; bold?: boolean }>, rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        repeat: false,
        height: { value: 500, rule: "auto" },
        children: headers.map(
          (h) =>
            new TableCell({
              width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
              shading: { fill: "0E2F56", color: "auto" },
              children: [
                new Paragraph({
                  text: h.text,
                  run: { bold: h.bold ?? true, color: "FFFFFF", size: 22 },
                }),
              ],
              borders: {
                top: { color: "0E2F56", space: 1, style: BorderStyle.SINGLE, size: 6 },
                bottom: { color: "0E2F56", space: 1, style: BorderStyle.SINGLE, size: 6 },
                left: { color: "0E2F56", space: 1, style: BorderStyle.SINGLE, size: 6 },
                right: { color: "0E2F56", space: 1, style: BorderStyle.SINGLE, size: 6 },
              },
            })
        ),
      }),
      ...rows.map((row, rowIdx) => {
        return new TableRow({
          repeat: false,
          height: { value: 400, rule: "auto" },
          children: row.map(
            (cell) =>
              new TableCell({
                width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
                shading: { fill: rowIdx % 2 === 0 ? "F5F5F5" : "FFFFFF", color: "auto" },
                children: [
                  new Paragraph({
                    text: cell,
                    run: { size: 20 },
                  }),
                ],
                borders: {
                  top: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 },
                  bottom: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 },
                  left: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 },
                  right: { color: "CCCCCC", space: 1, style: BorderStyle.SINGLE, size: 6 },
                },
              })
          ),
        });
      }),
    ],
  });
}
