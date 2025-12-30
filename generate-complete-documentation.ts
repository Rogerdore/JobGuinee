import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import * as fs from 'fs';

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // TITRE PRINCIPAL
      new Paragraph({
        text: "JOBGUINÉE",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "Documentation Technique Complète",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Version: 4.0 | Date: 30 Décembre 2024",
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 }
      }),

      // TABLE DES MATIÈRES
      new Paragraph({
        text: "TABLE DES MATIÈRES",
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({ text: "1. Vue d'ensemble de l'application", spacing: { after: 100 } }),
      new Paragraph({ text: "2. Architecture technique", spacing: { after: 100 } }),
      new Paragraph({ text: "3. Base de données Supabase", spacing: { after: 100 } }),
      new Paragraph({ text: "4. Services Backend", spacing: { after: 100 } }),
      new Paragraph({ text: "5. Frontend React/TypeScript", spacing: { after: 100 } }),
      new Paragraph({ text: "6. Workflows métier", spacing: { after: 100 } }),
      new Paragraph({ text: "7. Système SEO", spacing: { after: 100 } }),
      new Paragraph({ text: "8. Système de crédits et paiements", spacing: { after: 100 } }),
      new Paragraph({ text: "9. Intelligence artificielle", spacing: { after: 100 } }),
      new Paragraph({ text: "10. Sécurité et authentification", spacing: { after: 400 } }),

      // SECTION 1: VUE D'ENSEMBLE
      new Paragraph({
        text: "1. VUE D'ENSEMBLE DE L'APPLICATION",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "1.1 Présentation",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({
        text: "JobGuinée est une plateforme complète de recrutement et de gestion des talents pour la Guinée et l'Afrique francophone. Elle intègre un ATS (Applicant Tracking System) professionnel, une CVthèque, des services IA, et des solutions B2B.",
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: "1.2 Types d'utilisateurs",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• Candidat : Recherche d'emploi, création CV, candidatures", spacing: { after: 50 } }),
      new Paragraph({ text: "• Recruteur : Publication offres, gestion candidatures, CVthèque", spacing: { after: 50 } }),
      new Paragraph({ text: "• Formateur : Publication formations, gestion inscriptions", spacing: { after: 50 } }),
      new Paragraph({ text: "• Entreprise : Solutions B2B, externalisation recrutement", spacing: { after: 50 } }),
      new Paragraph({ text: "• Admin : Gestion plateforme, configuration, modération", spacing: { after: 200 } }),

      new Paragraph({
        text: "1.3 Fonctionnalités principales",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "✓ ATS complet avec pipeline Kanban", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ CVthèque avec profils anonymisés", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ Services IA (CV, lettres motivation, matching, coach)", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ Système de crédits et paiement Orange Money", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ Abonnements Premium (Gold, Pro, Enterprise)", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ SEO multilingue (FR/EN) avec Core Web Vitals", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ Formations professionnelles", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ Blog et ressources RH", spacing: { after: 50 } }),
      new Paragraph({ text: "✓ Solutions B2B et B2B2C", spacing: { after: 200 } }),

      // SECTION 2: ARCHITECTURE TECHNIQUE
      new Paragraph({
        text: "2. ARCHITECTURE TECHNIQUE",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "2.1 Stack technologique",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Frontend:", spacing: { after: 50 } }),
      new Paragraph({ text: "  • React 18.3 avec TypeScript", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Vite (build tool)", spacing: { after: 30 } }),
      new Paragraph({ text: "  • TailwindCSS pour le styling", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Lucide React pour les icônes", spacing: { after: 30 } }),
      new Paragraph({ text: "  • React Quill pour l'édition rich text", spacing: { after: 100 } }),
      new Paragraph({ text: "Backend:", spacing: { after: 50 } }),
      new Paragraph({ text: "  • Supabase (PostgreSQL + Auth + Storage + Edge Functions)", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Row Level Security (RLS) pour la sécurité", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Edge Functions Deno pour la logique serveur", spacing: { after: 100 } }),
      new Paragraph({ text: "Bibliothèques spécialisées:", spacing: { after: 50 } }),
      new Paragraph({ text: "  • jsPDF pour génération PDF", spacing: { after: 30 } }),
      new Paragraph({ text: "  • docx pour génération DOCX", spacing: { after: 30 } }),
      new Paragraph({ text: "  • html2canvas pour captures écran", spacing: { after: 30 } }),
      new Paragraph({ text: "  • mammoth pour parsing DOCX", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Tesseract.js pour OCR", spacing: { after: 200 } }),

      new Paragraph({
        text: "2.2 Architecture en couches",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Couche Présentation (Frontend):", spacing: { after: 50 } }),
      new Paragraph({ text: "  • Pages (src/pages/) : Vues principales", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Components (src/components/) : Composants réutilisables", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Contexts (src/contexts/) : State management global", spacing: { after: 100 } }),
      new Paragraph({ text: "Couche Logique (Services):", spacing: { after: 50 } }),
      new Paragraph({ text: "  • Services (src/services/) : 50+ services métier", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Hooks (src/hooks/) : Custom React hooks", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Utils (src/utils/) : Fonctions utilitaires", spacing: { after: 100 } }),
      new Paragraph({ text: "Couche Données:", spacing: { after: 50 } }),
      new Paragraph({ text: "  • Supabase Client (src/lib/supabase.ts)", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Database PostgreSQL avec 100+ tables", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Migrations versionnées (supabase/migrations/)", spacing: { after: 200 } }),

      new Paragraph({
        text: "2.3 Patterns et principes",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• Single Responsibility Principle : Un service = une responsabilité", spacing: { after: 50 } }),
      new Paragraph({ text: "• Dependency Injection : Services injectés via imports", spacing: { after: 50 } }),
      new Paragraph({ text: "• Repository Pattern : Services comme repositories", spacing: { after: 50 } }),
      new Paragraph({ text: "• Observer Pattern : Hooks React pour reactivity", spacing: { after: 50 } }),
      new Paragraph({ text: "• Factory Pattern : Génération automatique (SEO, schemas)", spacing: { after: 200 } }),

      // SECTION 3: BASE DE DONNÉES
      new Paragraph({
        text: "3. BASE DE DONNÉES SUPABASE",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "3.1 Tables principales (100+ tables)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),

      new Paragraph({
        text: "Authentification et Profils:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• auth.users (Supabase) : Utilisateurs authentifiés", spacing: { after: 30 } }),
      new Paragraph({ text: "• profiles : Profils utilisateurs avec user_type", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidate_profiles : Profils candidats détaillés", spacing: { after: 30 } }),
      new Paragraph({ text: "• recruiter_profiles : Profils recruteurs", spacing: { after: 30 } }),
      new Paragraph({ text: "• trainer_profiles : Profils formateurs", spacing: { after: 100 } }),

      new Paragraph({
        text: "Emploi et Recrutement:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• jobs : Offres d'emploi", spacing: { after: 30 } }),
      new Paragraph({ text: "• companies : Entreprises", spacing: { after: 30 } }),
      new Paragraph({ text: "• applications : Candidatures", spacing: { after: 30 } }),
      new Paragraph({ text: "• workflow_stages : Étapes du pipeline ATS", spacing: { after: 30 } }),
      new Paragraph({ text: "• application_actions_history : Historique des actions", spacing: { after: 30 } }),
      new Paragraph({ text: "• interviews : Entretiens planifiés", spacing: { after: 30 } }),
      new Paragraph({ text: "• interview_evaluations : Évaluations candidats", spacing: { after: 100 } }),

      new Paragraph({
        text: "CVthèque:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• profile_cart : Panier de profils", spacing: { after: 30 } }),
      new Paragraph({ text: "• profile_purchases : Achats de profils", spacing: { after: 30 } }),
      new Paragraph({ text: "• cart_history : Historique des paniers", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidate_verifications : Vérifications de profils", spacing: { after: 100 } }),

      new Paragraph({
        text: "Formations:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• formations : Formations disponibles", spacing: { after: 30 } }),
      new Paragraph({ text: "• formation_enrollments : Inscriptions formations", spacing: { after: 100 } }),

      new Paragraph({
        text: "Contenu:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• blog_posts : Articles de blog", spacing: { after: 30 } }),
      new Paragraph({ text: "• resources : Ressources RH", spacing: { after: 30 } }),
      new Paragraph({ text: "• homepage_content : Contenu page d'accueil", spacing: { after: 30 } }),
      new Paragraph({ text: "• video_guides : Guides vidéo", spacing: { after: 100 } }),

      new Paragraph({
        text: "Crédits et Paiements:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• credit_packages : Packs de crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• credit_purchases : Achats de crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• service_credit_costs : Coûts par service IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• ai_service_usage_history : Historique utilisation IA", spacing: { after: 100 } }),

      new Paragraph({
        text: "Abonnements:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• premium_subscriptions : Abonnements Premium", spacing: { after: 30 } }),
      new Paragraph({ text: "• enterprise_subscriptions : Abonnements Entreprise", spacing: { after: 30 } }),
      new Paragraph({ text: "• enterprise_packs : Packs Entreprise", spacing: { after: 100 } }),

      new Paragraph({
        text: "SEO (15 tables):",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• seo_config / seo_config_i18n : Configuration SEO", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_page_meta / seo_page_meta_i18n : Métadonnées pages", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_hreflang_config : Configuration multilingue", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_keywords / seo_keywords_i18n : Mots-clés", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_schemas : Données structurées schema.org", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_page_analytics : Analytics + Core Web Vitals", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_internal_links : Maillage interne", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_external_links : Backlinks", spacing: { after: 30 } }),
      new Paragraph({ text: "• seo_conversion_logs : Conversions SEO", spacing: { after: 100 } }),

      new Paragraph({
        text: "Notifications et Messagerie:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• notifications : Notifications système", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidate_messages : Messagerie candidats", spacing: { after: 30 } }),
      new Paragraph({ text: "• communication_templates : Templates emails/SMS", spacing: { after: 100 } }),

      new Paragraph({
        text: "IA et Chatbot:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• chatbot_conversations : Conversations chatbot", spacing: { after: 30 } }),
      new Paragraph({ text: "• chatbot_messages : Messages chatbot", spacing: { after: 30 } }),
      new Paragraph({ text: "• job_alerts : Alertes emploi", spacing: { after: 30 } }),
      new Paragraph({ text: "• interview_simulations : Simulations entretien", spacing: { after: 100 } }),

      new Paragraph({
        text: "B2B:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• b2b_leads : Leads B2B", spacing: { after: 30 } }),
      new Paragraph({ text: "• b2b_services : Services B2B proposés", spacing: { after: 100 } }),

      new Paragraph({
        text: "Autres:",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 }
      }),
      new Paragraph({ text: "• newsletter_subscribers : Abonnés newsletter", spacing: { after: 30 } }),
      new Paragraph({ text: "• automation_rules : Règles d'automatisation", spacing: { after: 30 } }),
      new Paragraph({ text: "• security_logs : Logs de sécurité", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidate_documents : Documents candidats", spacing: { after: 200 } }),

      new Paragraph({
        text: "3.2 Row Level Security (RLS)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Toutes les tables ont RLS activé avec politiques:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Public read : Données publiques (jobs, formations, blog)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Authenticated : Utilisateurs connectés (profils, candidatures)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Own data : Utilisateur voit uniquement ses données", spacing: { after: 30 } }),
      new Paragraph({ text: "• Role-based : Admin, Recruteur, Candidat (user_type)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Premium access : Fonctionnalités premium réservées", spacing: { after: 200 } }),

      new Paragraph({
        text: "3.3 Fonctions et triggers",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Fonctions RPC:", spacing: { after: 50 } }),
      new Paragraph({ text: "• get_page_meta_with_i18n() : Meta SEO multilingue", spacing: { after: 30 } }),
      new Paragraph({ text: "• get_hreflang_alternates() : Alternates hreflang", spacing: { after: 30 } }),
      new Paragraph({ text: "• use_ai_credits() : Déduction crédits IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• get_recruiter_dashboard_metrics() : Métriques recruteur", spacing: { after: 100 } }),
      new Paragraph({ text: "Triggers:", spacing: { after: 50 } }),
      new Paragraph({ text: "• on_user_created : Création profil après inscription", spacing: { after: 30 } }),
      new Paragraph({ text: "• sync_base_to_i18n : Sync SEO FR vers i18n", spacing: { after: 30 } }),
      new Paragraph({ text: "• update_profile_completion : Calcul % complétion profil", spacing: { after: 200 } }),

      // SECTION 4: SERVICES BACKEND
      new Paragraph({
        text: "4. SERVICES BACKEND",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "4.1 Services SEO (13 services)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• seoService.ts : Meta tags, i18n, hreflang", spacing: { after: 30 } }),
      new Paragraph({ text: "• schemaService.ts : 13 types schema.org", spacing: { after: 30 } }),
      new Paragraph({ text: "• sitemapService.ts : Sitemap XML multilingue", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoCoreWebVitalsService.ts : LCP, FID, CLS monitoring", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoMobileOptimizationService.ts : Audit mobile", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoConversionTrackingService.ts : Attribution SEO", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoAnalyticsService.ts : Métriques GSC/GA4", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoAuditService.ts : Audit complet", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoScoringService.ts : Scoring pages", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoSemanticAIService.ts : Suggestions IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoAutoGeneratorService.ts : Génération automatique", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoInternalLinkingService.ts : Maillage interne", spacing: { after: 30 } }),
      new Paragraph({ text: "• seoExternalLinkingService.ts : Backlinks", spacing: { after: 100 } }),

      new Paragraph({
        text: "4.2 Services IA",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• cvBuilderService.ts : Génération CV", spacing: { after: 30 } }),
      new Paragraph({ text: "• cvImproverService.ts : Amélioration CV", spacing: { after: 30 } }),
      new Paragraph({ text: "• cvTargetedService.ts : CV ciblé par offre", spacing: { after: 30 } }),
      new Paragraph({ text: "• cvUploadParserService.ts : Parsing CV uploadé", spacing: { after: 30 } }),
      new Paragraph({ text: "• recruiterAIMatchingService.ts : Matching IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• interviewSimulatorService.ts : Simulation entretien", spacing: { after: 30 } }),
      new Paragraph({ text: "• chatbotService.ts : Chatbot assistance", spacing: { after: 30 } }),
      new Paragraph({ text: "• trainerAIService.ts : IA formateur", spacing: { after: 100 } }),

      new Paragraph({
        text: "4.3 Services Recrutement",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• recruiterDashboardService.ts : Dashboard recruteur", spacing: { after: 30 } }),
      new Paragraph({ text: "• applicationActionsService.ts : Actions sur candidatures", spacing: { after: 30 } }),
      new Paragraph({ text: "• applicationSubmissionService.ts : Soumission candidatures", spacing: { after: 30 } }),
      new Paragraph({ text: "• interviewSchedulingService.ts : Planification entretiens", spacing: { after: 30 } }),
      new Paragraph({ text: "• interviewEvaluationService.ts : Évaluation candidats", spacing: { after: 30 } }),
      new Paragraph({ text: "• communicationService.ts : Emails/SMS candidats", spacing: { after: 30 } }),
      new Paragraph({ text: "• recruitmentAutomationService.ts : Automatisation", spacing: { after: 100 } }),

      new Paragraph({
        text: "4.4 Services Crédits et Paiements",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• creditService.ts : Gestion crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• creditStoreService.ts : Boutique crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• premiumSubscriptionService.ts : Abonnements premium", spacing: { after: 30 } }),
      new Paragraph({ text: "• enterpriseSubscriptionService.ts : Abonnements entreprise", spacing: { after: 30 } }),
      new Paragraph({ text: "• paymentProviders.ts : Intégration paiements", spacing: { after: 100 } }),

      new Paragraph({
        text: "4.5 Services Utilisateur",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• userProfileService.ts : Gestion profils", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidateDocumentService.ts : Documents candidats", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidateMessagingService.ts : Messagerie", spacing: { after: 30 } }),
      new Paragraph({ text: "• candidateApplicationTrackingService.ts : Suivi candidatures", spacing: { after: 30 } }),
      new Paragraph({ text: "• notificationService.ts : Notifications", spacing: { after: 100 } }),

      new Paragraph({
        text: "4.6 Services Divers",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• pdfService.ts : Génération PDF", spacing: { after: 30 } }),
      new Paragraph({ text: "• b2bLeadsService.ts : Leads B2B", spacing: { after: 30 } }),
      new Paragraph({ text: "• trainerService.ts : Gestion formateurs", spacing: { after: 30 } }),
      new Paragraph({ text: "• homepageContentService.ts : Contenu homepage", spacing: { after: 30 } }),
      new Paragraph({ text: "• jobAlertsService.ts : Alertes emploi", spacing: { after: 200 } }),

      // SECTION 5: FRONTEND
      new Paragraph({
        text: "5. FRONTEND REACT/TYPESCRIPT",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "5.1 Structure des pages",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Pages publiques:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Home.tsx : Page d'accueil", spacing: { after: 30 } }),
      new Paragraph({ text: "• Jobs.tsx : Liste offres emploi", spacing: { after: 30 } }),
      new Paragraph({ text: "• JobDetail.tsx : Détail offre", spacing: { after: 30 } }),
      new Paragraph({ text: "• Formations.tsx : Formations disponibles", spacing: { after: 30 } }),
      new Paragraph({ text: "• Blog.tsx : Articles blog", spacing: { after: 30 } }),
      new Paragraph({ text: "• B2BSolutions.tsx : Solutions B2B", spacing: { after: 100 } }),
      new Paragraph({ text: "Pages authentifiées:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Auth.tsx : Connexion/Inscription", spacing: { after: 30 } }),
      new Paragraph({ text: "• CandidateDashboard.tsx : Dashboard candidat", spacing: { after: 30 } }),
      new Paragraph({ text: "• RecruiterDashboard.tsx : Dashboard recruteur", spacing: { after: 30 } }),
      new Paragraph({ text: "• TrainerDashboard.tsx : Dashboard formateur", spacing: { after: 30 } }),
      new Paragraph({ text: "• CVTheque.tsx : CVthèque (recruteurs)", spacing: { after: 30 } }),
      new Paragraph({ text: "• PurchasedProfiles.tsx : Profils achetés", spacing: { after: 100 } }),
      new Paragraph({ text: "Pages Premium:", spacing: { after: 50 } }),
      new Paragraph({ text: "• PremiumAIServices.tsx : Services IA premium", spacing: { after: 30 } }),
      new Paragraph({ text: "• PremiumSubscribe.tsx : Abonnement premium", spacing: { after: 30 } }),
      new Paragraph({ text: "• EnterpriseSubscribe.tsx : Abonnement entreprise", spacing: { after: 30 } }),
      new Paragraph({ text: "• CreditStore.tsx : Boutique crédits", spacing: { after: 100 } }),
      new Paragraph({ text: "Pages Admin (20+ pages):", spacing: { after: 50 } }),
      new Paragraph({ text: "• UserManagement.tsx : Gestion utilisateurs", spacing: { after: 30 } }),
      new Paragraph({ text: "• AdminSEO.tsx : Gestion SEO complète", spacing: { after: 30 } }),
      new Paragraph({ text: "• AdminIACenter.tsx : Centre IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• AdminCreditsIA.tsx : Gestion crédits IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• AdminJobModeration.tsx : Modération offres", spacing: { after: 30 } }),
      new Paragraph({ text: "• CMSAdmin.tsx : Gestion contenu", spacing: { after: 200 } }),

      new Paragraph({
        text: "5.2 Composants réutilisables",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Formulaires:", spacing: { after: 50 } }),
      new Paragraph({ text: "• CandidateProfileForm.tsx : Formulaire profil candidat", spacing: { after: 30 } }),
      new Paragraph({ text: "• RecruiterProfileForm.tsx : Formulaire profil recruteur", spacing: { after: 30 } }),
      new Paragraph({ text: "• JobPublishForm.tsx : Publication offre", spacing: { after: 30 } }),
      new Paragraph({ text: "• FormationPublishForm.tsx : Publication formation", spacing: { after: 30 } }),
      new Paragraph({ text: "• RichTextEditor.tsx : Éditeur texte riche", spacing: { after: 100 } }),
      new Paragraph({ text: "IA:", spacing: { after: 50 } }),
      new Paragraph({ text: "• AIChat.tsx : Chat IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• AICVGenerator.tsx : Générateur CV", spacing: { after: 30 } }),
      new Paragraph({ text: "• AICoverLetterGenerator.tsx : Générateur lettre", spacing: { after: 30 } }),
      new Paragraph({ text: "• AIMatchingService.tsx : Matching IA", spacing: { after: 30 } }),
      new Paragraph({ text: "• AIInterviewSimulator.tsx : Simulation entretien", spacing: { after: 100 } }),
      new Paragraph({ text: "Recrutement:", spacing: { after: 50 } }),
      new Paragraph({ text: "• KanbanBoard.tsx : Pipeline Kanban", spacing: { after: 30 } }),
      new Paragraph({ text: "• ApplicationCard.tsx : Carte candidature", spacing: { after: 30 } }),
      new Paragraph({ text: "• CandidateProfileModal.tsx : Modal profil candidat", spacing: { after: 30 } }),
      new Paragraph({ text: "• InterviewCard.tsx : Carte entretien", spacing: { after: 30 } }),
      new Paragraph({ text: "• AnalyticsDashboard.tsx : Analytics recruteur", spacing: { after: 100 } }),
      new Paragraph({ text: "CVthèque:", spacing: { after: 50 } }),
      new Paragraph({ text: "• CandidateCard.tsx : Carte candidat", spacing: { after: 30 } }),
      new Paragraph({ text: "• AnonymizedCandidateCard.tsx : Carte anonymisée", spacing: { after: 30 } }),
      new Paragraph({ text: "• ProfileCart.tsx : Panier profils", spacing: { after: 30 } }),
      new Paragraph({ text: "• AdvancedFilters.tsx : Filtres avancés", spacing: { after: 100 } }),
      new Paragraph({ text: "Notifications:", spacing: { after: 50 } }),
      new Paragraph({ text: "• NotificationCenter.tsx : Centre notifications", spacing: { after: 30 } }),
      new Paragraph({ text: "• ToastNotification.tsx : Toast", spacing: { after: 30 } }),
      new Paragraph({ text: "• SuccessModal.tsx : Modal succès", spacing: { after: 100 } }),
      new Paragraph({ text: "Paiements:", spacing: { after: 50 } }),
      new Paragraph({ text: "• OrangeMoneyPaymentInfo.tsx : Info Orange Money", spacing: { after: 30 } }),
      new Paragraph({ text: "• CreditBalance.tsx : Solde crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• CreditConfirmModal.tsx : Confirmation crédit", spacing: { after: 200 } }),

      new Paragraph({
        text: "5.3 Contexts (State Management)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• AuthContext.tsx : Authentification globale", spacing: { after: 30 } }),
      new Paragraph({ text: "  - user, profile, loading, signIn, signOut, signUp", spacing: { after: 50 } }),
      new Paragraph({ text: "• NotificationContext.tsx : Notifications globales", spacing: { after: 30 } }),
      new Paragraph({ text: "  - showSuccess, showError, showInfo, notifications[]", spacing: { after: 50 } }),
      new Paragraph({ text: "• CMSContext.tsx : Contenu CMS", spacing: { after: 30 } }),
      new Paragraph({ text: "  - homepage, blog, formations, updateContent", spacing: { after: 200 } }),

      new Paragraph({
        text: "5.4 Hooks personnalisés",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• useSEO.ts : SEO automatique par page", spacing: { after: 30 } }),
      new Paragraph({ text: "• useCreditService.ts : Gestion crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• usePricing.ts : Tarification dynamique", spacing: { after: 30 } }),
      new Paragraph({ text: "• useAutoSave.ts : Sauvegarde automatique", spacing: { after: 30 } }),
      new Paragraph({ text: "• useCVParsing.ts : Parsing CV", spacing: { after: 30 } }),
      new Paragraph({ text: "• usePendingApplication.ts : Candidature en cours", spacing: { after: 30 } }),
      new Paragraph({ text: "• useEnterpriseSubscription.ts : Abonnement entreprise", spacing: { after: 200 } }),

      // SECTION 6: WORKFLOWS
      new Paragraph({
        text: "6. WORKFLOWS MÉTIER",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "6.1 Workflow Candidature",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "1. Candidat consulte offre (JobDetail.tsx)", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Clic 'Postuler' → JobApplicationModal.tsx", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Vérification profil complet (profileCompletion.ts)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Import documents (CV, lettre, certificats)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Génération lettre motivation IA (optionnel)", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Déduction crédit si service IA utilisé", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Soumission → applicationSubmissionService.ts", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Insertion dans 'applications' (statut: submitted)", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Notification recruteur (notificationService.ts)", spacing: { after: 30 } }),
      new Paragraph({ text: "10. Email confirmation candidat", spacing: { after: 30 } }),
      new Paragraph({ text: "11. Candidat suit statut (ApplicationTrackingModal.tsx)", spacing: { after: 200 } }),

      new Paragraph({
        text: "6.2 Workflow Recruteur ATS",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Pipeline Kanban (7 étapes):", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Nouvelles candidatures (new)", spacing: { after: 30 } }),
      new Paragraph({ text: "2. En révision (reviewing)", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Pré-sélectionné (shortlisted)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Entretien planifié (interview_scheduled)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Offre envoyée (offer_sent)", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Accepté (accepted)", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Rejeté (rejected)", spacing: { after: 100 } }),
      new Paragraph({ text: "Actions disponibles:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Déplacer entre étapes (drag & drop)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Voir détails candidat (CandidateProfileModal)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Télécharger CV/documents", spacing: { after: 30 } }),
      new Paragraph({ text: "• Planifier entretien (ScheduleInterviewModal)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Envoyer message (SendMessageModal)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Évaluer candidat (InterviewEvaluationModal)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Comparer candidats (CandidateComparisonModal)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Exporter données (ExportModal)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Matching IA (AIMatchingModal)", spacing: { after: 200 } }),

      new Paragraph({
        text: "6.3 Workflow CVthèque",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "1. Recruteur accède CVtheque.tsx", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Profils affichés anonymisés (sans nom/contact)", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Filtres avancés (secteur, compétences, expérience, ville)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Clic profil → CandidatePreviewModal (aperçu anonyme)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Ajout au panier (ProfileCart)", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Vérification pack/crédits disponibles", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Checkout → CheckoutConfirmation", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Paiement ou déduction pack entreprise", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Insertion profile_purchases", spacing: { after: 30 } }),
      new Paragraph({ text: "10. Déverrouillage coordonnées complètes", spacing: { after: 30 } }),
      new Paragraph({ text: "11. Accès PurchasedProfiles.tsx (profils achetés)", spacing: { after: 30 } }),
      new Paragraph({ text: "12. Contact direct candidat possible", spacing: { after: 200 } }),

      new Paragraph({
        text: "6.4 Workflow Services IA",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Prérequis: Candidat avec crédits suffisants", spacing: { after: 100 } }),
      new Paragraph({ text: "Génération CV:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Clic 'Générer CV avec IA'", spacing: { after: 30 } }),
      new Paragraph({ text: "2. AICVGenerator.tsx ouvert", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Sélection template (classique, moderne, créatif)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Saisie informations complémentaires", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Vérification coût (service_credit_costs)", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Confirmation → CreditConfirmModal", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Déduction crédits (use_ai_credits RPC)", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Génération CV (cvBuilderService.ts)", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Aperçu CV généré", spacing: { after: 30 } }),
      new Paragraph({ text: "10. Téléchargement PDF/DOCX (pdfService.ts)", spacing: { after: 30 } }),
      new Paragraph({ text: "11. Sauvegarde dans candidate_documents", spacing: { after: 100 } }),
      new Paragraph({ text: "Matching IA (recruteur):", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Recruteur ouvre offre", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Clic 'Matching IA' → AIMatchingModal", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Sélection critères matching", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Vérification tarification (recruiterMatchingPricingService)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Lancement matching (recruiterAIMatchingService)", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Analyse profils candidats (algorithme scoring)", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Rapport matching avec scores", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Top candidats recommandés", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Contact direct ou ajout pipeline", spacing: { after: 200 } }),

      new Paragraph({
        text: "6.5 Workflow Abonnement Premium",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "1. Utilisateur consulte PremiumSubscribe.tsx", spacing: { after: 30 } }),
      new Paragraph({ text: "2. 3 plans affichés: Gold, Pro, Enterprise", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Comparaison fonctionnalités (PremiumPlans.tsx)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Sélection plan et durée (1/3/6/12 mois)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Calcul prix avec réductions durée", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Choix mode paiement (Orange Money, MTN, carte)", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Confirmation → premiumSubscriptionService.ts", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Insertion premium_subscriptions", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Attribution quota IA premium", spacing: { after: 30 } }),
      new Paragraph({ text: "10. Activation fonctionnalités premium", spacing: { after: 30 } }),
      new Paragraph({ text: "11. Badge 'Premium' sur profil", spacing: { after: 30 } }),
      new Paragraph({ text: "12. Email confirmation + facture", spacing: { after: 200 } }),

      // SECTION 7: SYSTÈME SEO
      new Paragraph({
        text: "7. SYSTÈME SEO",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "7.1 Architecture SEO",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Le système SEO est multilingue (FR/EN) avec 15 tables dédiées.", spacing: { after: 100 } }),
      new Paragraph({ text: "Composants:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Configuration globale (seo_config + i18n)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Métadonnées par page (seo_page_meta + i18n)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Hreflang multilingue (seo_hreflang_config)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Mots-clés trackés (seo_keywords + i18n)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Schémas structurés (seo_schemas) - 13 types", spacing: { after: 30 } }),
      new Paragraph({ text: "• Analytics (seo_page_analytics + Core Web Vitals)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Maillage interne (seo_internal_links)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Backlinks (seo_external_links)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Conversions SEO (seo_conversion_logs)", spacing: { after: 200 } }),

      new Paragraph({
        text: "7.2 Fonctionnalités SEO",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Meta tags dynamiques:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Title, description, keywords par page", spacing: { after: 30 } }),
      new Paragraph({ text: "• Open Graph (Facebook, LinkedIn)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Twitter Cards", spacing: { after: 30 } }),
      new Paragraph({ text: "• Canonical URLs", spacing: { after: 30 } }),
      new Paragraph({ text: "• Robots directives", spacing: { after: 100 } }),
      new Paragraph({ text: "Multilingue:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Balises hreflang (fr, en, x-default)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Fallback automatique vers FR", spacing: { after: 30 } }),
      new Paragraph({ text: "• URLs SEO-friendly par langue", spacing: { after: 30 } }),
      new Paragraph({ text: "• Meta traduits (title, description, keywords)", spacing: { after: 100 } }),
      new Paragraph({ text: "Schémas structurés (schema.org):", spacing: { after: 50 } }),
      new Paragraph({ text: "• Organization (site global)", spacing: { after: 30 } }),
      new Paragraph({ text: "• JobPosting (Google for Jobs)", spacing: { after: 30 } }),
      new Paragraph({ text: "• LocalBusiness (entreprises guinéennes)", spacing: { after: 30 } }),
      new Paragraph({ text: "• AggregateOffer (salaires)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Course (formations)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Article (blog)", spacing: { after: 30 } }),
      new Paragraph({ text: "• VideoObject (guides vidéo)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Event (salons emploi)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Review (témoignages)", spacing: { after: 30 } }),
      new Paragraph({ text: "• + 4 autres types", spacing: { after: 100 } }),
      new Paragraph({ text: "Performance:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Core Web Vitals monitoring (LCP, FID, CLS)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Real User Monitoring (RUM)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Scoring automatique (bon/moyen/mauvais)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Recommandations d'optimisation", spacing: { after: 100 } }),
      new Paragraph({ text: "Mobile SEO:", spacing: { after: 50 } }),
      new Paragraph({ text: "• 10 vérifications automatiques", spacing: { after: 30 } }),
      new Paragraph({ text: "• Score mobile-friendly", spacing: { after: 30 } }),
      new Paragraph({ text: "• Optimisé pour 3G africaine", spacing: { after: 100 } }),
      new Paragraph({ text: "Conversion tracking:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Attribution par source (organic, social, paid, direct)", spacing: { after: 30 } }),
      new Paragraph({ text: "• 7 types de conversions trackées", spacing: { after: 30 } }),
      new Paragraph({ text: "• ROI SEO calculé", spacing: { after: 30 } }),
      new Paragraph({ text: "• Landing page tracking", spacing: { after: 100 } }),
      new Paragraph({ text: "Sitemap:", spacing: { after: 50 } }),
      new Paragraph({ text: "• XML dynamique avec images et vidéos", spacing: { after: 30 } }),
      new Paragraph({ text: "• Alternates multilingues", spacing: { after: 30 } }),
      new Paragraph({ text: "• Priorités et fréquences crawl", spacing: { after: 200 } }),

      new Paragraph({
        text: "7.3 Interface Admin SEO",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "AdminSEO.tsx comprend 16 onglets:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Config : Configuration globale", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Config i18n : Traductions FR/EN", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Pages SEO : Gestion meta par page", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Pages i18n : Traductions pages", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Keywords : Suivi mots-clés", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Generator : Génération automatique pages", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Sitemap : Gestion sitemap XML", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Analytics : Métriques SEO", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Conversion Tracking : Suivi conversions", spacing: { after: 30 } }),
      new Paragraph({ text: "10. Core Web Vitals : Performance", spacing: { after: 30 } }),
      new Paragraph({ text: "11. Mobile SEO : Audit mobile", spacing: { after: 30 } }),
      new Paragraph({ text: "12. Logs : Historique opérations", spacing: { after: 30 } }),
      new Paragraph({ text: "13. AI Content : Suggestions IA", spacing: { after: 30 } }),
      new Paragraph({ text: "14. Scoring : Score pages", spacing: { after: 30 } }),
      new Paragraph({ text: "15. Internal Links : Maillage interne", spacing: { after: 30 } }),
      new Paragraph({ text: "16. External Links : Backlinks", spacing: { after: 200 } }),

      // SECTION 8: CRÉDITS ET PAIEMENTS
      new Paragraph({
        text: "8. SYSTÈME DE CRÉDITS ET PAIEMENTS",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "8.1 Économie des crédits",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Les crédits sont l'unité monétaire interne pour services IA.", spacing: { after: 100 } }),
      new Paragraph({ text: "Coûts par service (service_credit_costs):", spacing: { after: 50 } }),
      new Paragraph({ text: "• Génération CV : 50 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• Amélioration CV : 30 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• CV ciblé : 40 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• Lettre motivation : 30 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• Parsing CV : 20 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• Simulation entretien : 40 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• Matching IA (recruteur) : 100 crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "• Coach IA : 25 crédits/session", spacing: { after: 100 } }),
      new Paragraph({ text: "Packs de crédits (credit_packages):", spacing: { after: 50 } }),
      new Paragraph({ text: "• Starter : 100 crédits → 10 000 GNF", spacing: { after: 30 } }),
      new Paragraph({ text: "• Basic : 250 crédits → 22 500 GNF (10% réduction)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Pro : 500 crédits → 42 500 GNF (15% réduction)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Premium : 1000 crédits → 80 000 GNF (20% réduction)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Ultimate : 2500 crédits → 187 500 GNF (25% réduction)", spacing: { after: 100 } }),

      new Paragraph({
        text: "8.2 Workflow d'achat crédits",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "1. Utilisateur ouvre CreditStore.tsx", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Sélection pack de crédits", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Choix mode paiement:", spacing: { after: 30 } }),
      new Paragraph({ text: "   • Orange Money (Guinée)", spacing: { after: 30 } }),
      new Paragraph({ text: "   • MTN Mobile Money", spacing: { after: 30 } }),
      new Paragraph({ text: "   • Carte bancaire (Stripe/PayPal)", spacing: { after: 50 } }),
      new Paragraph({ text: "4. Affichage instructions paiement (OrangeMoneyPaymentInfo)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Utilisateur effectue paiement externe", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Webhook reçu (payment-webhook-orange Edge Function)", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Vérification paiement", spacing: { after: 30 } }),
      new Paragraph({ text: "8. Insertion credit_purchases", spacing: { after: 30 } }),
      new Paragraph({ text: "9. Mise à jour profiles.credits_balance", spacing: { after: 30 } }),
      new Paragraph({ text: "10. Notification utilisateur", spacing: { after: 30 } }),
      new Paragraph({ text: "11. Email confirmation + reçu", spacing: { after: 200 } }),

      new Paragraph({
        text: "8.3 Déduction crédits",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Fonction RPC: use_ai_credits(user_id, service_name, credits)", spacing: { after: 100 } }),
      new Paragraph({ text: "Logique:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Vérifier solde suffisant", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Déduire crédits de profiles.credits_balance", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Insérer dans ai_service_usage_history", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Retourner nouveau solde", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Si solde insuffisant → erreur", spacing: { after: 100 } }),
      new Paragraph({ text: "Sécurité:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Transaction atomique (ACID)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Logs anti-fraude (security_logs)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Rate limiting par service", spacing: { after: 30 } }),
      new Paragraph({ text: "• Détection abus (quota journalier)", spacing: { after: 200 } }),

      new Paragraph({
        text: "8.4 Abonnements Premium",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Plans disponibles:", spacing: { after: 50 } }),
      new Paragraph({ text: "Gold (Candidat):", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Prix: 50 000 GNF/mois", spacing: { after: 30 } }),
      new Paragraph({ text: "  • 500 crédits IA/mois", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Profil Gold badge", spacing: { after: 30 } }),
      new Paragraph({ text: "  • CV templates premium", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Coaching IA illimité", spacing: { after: 50 } }),
      new Paragraph({ text: "Pro (Recruteur):", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Prix: 150 000 GNF/mois", spacing: { after: 30 } }),
      new Paragraph({ text: "  • 20 offres actives simultanées", spacing: { after: 30 } }),
      new Paragraph({ text: "  • 1000 crédits IA/mois", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Matching IA illimité", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Analytics avancés", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Automatisation recrutement", spacing: { after: 50 } }),
      new Paragraph({ text: "Enterprise (Entreprise):", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Prix: 500 000 GNF/mois", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Packs profils CVthèque", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Externalisation recrutement", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Multi-utilisateurs", spacing: { after: 30 } }),
      new Paragraph({ text: "  • Support dédié", spacing: { after: 30 } }),
      new Paragraph({ text: "  • White-label optionnel", spacing: { after: 200 } }),

      // SECTION 9: IA
      new Paragraph({
        text: "9. INTELLIGENCE ARTIFICIELLE",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "9.1 Services IA disponibles",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Pour candidats:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Génération CV complète (cvBuilderService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Amélioration CV existant (cvImproverService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• CV ciblé par offre (cvTargetedService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Génération lettre motivation", spacing: { after: 30 } }),
      new Paragraph({ text: "• Parsing CV uploadé (cvUploadParserService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Coach IA conversationnel", spacing: { after: 30 } }),
      new Paragraph({ text: "• Simulation entretien (interviewSimulatorService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Plan de carrière", spacing: { after: 30 } }),
      new Paragraph({ text: "• Chatbot assistant", spacing: { after: 100 } }),
      new Paragraph({ text: "Pour recruteurs:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Matching IA candidats/offre (recruiterAIMatchingService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Génération description offre", spacing: { after: 30 } }),
      new Paragraph({ text: "• Analyse profils batch", spacing: { after: 30 } }),
      new Paragraph({ text: "• Recommandations candidats", spacing: { after: 30 } }),
      new Paragraph({ text: "• Scoring automatique", spacing: { after: 100 } }),
      new Paragraph({ text: "Pour formateurs:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Génération contenu formation (trainerAIService)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Structuration programme", spacing: { after: 30 } }),
      new Paragraph({ text: "• Quiz automatiques", spacing: { after: 200 } }),

      new Paragraph({
        text: "9.2 Architecture IA",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Type d'IA: Template-based + règles métier", spacing: { after: 50 } }),
      new Paragraph({ text: "Note: Pas de LLM externe (Claude/GPT) actuellement", spacing: { after: 30 } }),
      new Paragraph({ text: "      → Système déterministe, rapide, économique", spacing: { after: 100 } }),
      new Paragraph({ text: "Composants:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Templates : Modèles prédéfinis par type (CV, lettre)", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Règles métier : Logique conditionnelle", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Scoring : Algorithmes notation (matching)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Parsing : Extraction données (CV, offres)", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Génération : Construction contenu structuré", spacing: { after: 100 } }),
      new Paragraph({ text: "Avantages:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Coût fixe (pas d'API externe)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Latence faible (<1s)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Contrôle total qualité", spacing: { after: 30 } }),
      new Paragraph({ text: "• Offline-capable", spacing: { after: 30 } }),
      new Paragraph({ text: "• Conforme RGPD (données locales)", spacing: { after: 100 } }),
      new Paragraph({ text: "Évolution future:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Intégration LLM (Claude Sonnet) pour contenu avancé", spacing: { after: 30 } }),
      new Paragraph({ text: "• ML pour amélioration continue matching", spacing: { after: 30 } }),
      new Paragraph({ text: "• NLP pour analyse sémantique CV", spacing: { after: 200 } }),

      new Paragraph({
        text: "9.3 Exemple: Matching IA",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Service: recruiterAIMatchingService.ts", spacing: { after: 100 } }),
      new Paragraph({ text: "Algorithme de scoring (0-100):", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Compétences techniques (35 points max)", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Matching exact compétences requises", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Bonus compétences supplémentaires", spacing: { after: 50 } }),
      new Paragraph({ text: "2. Expérience (25 points max)", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Années d'expérience vs requis", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Secteur d'activité similaire", spacing: { after: 50 } }),
      new Paragraph({ text: "3. Formation (20 points max)", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Niveau diplôme vs requis", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Domaine d'études pertinent", spacing: { after: 50 } }),
      new Paragraph({ text: "4. Localisation (10 points max)", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Même ville = +10", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Même région = +5", spacing: { after: 50 } }),
      new Paragraph({ text: "5. Disponibilité (10 points max)", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Immédiat = +10", spacing: { after: 30 } }),
      new Paragraph({ text: "   - < 1 mois = +7", spacing: { after: 30 } }),
      new Paragraph({ text: "   - < 3 mois = +5", spacing: { after: 100 } }),
      new Paragraph({ text: "Résultat:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Liste candidats triés par score décroissant", spacing: { after: 30 } }),
      new Paragraph({ text: "• Rapport détaillé avec justifications", spacing: { after: 30 } }),
      new Paragraph({ text: "• Recommandations d'actions (contacter, shortlist)", spacing: { after: 200 } }),

      // SECTION 10: SÉCURITÉ
      new Paragraph({
        text: "10. SÉCURITÉ ET AUTHENTIFICATION",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "10.1 Authentification Supabase",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Méthode: Email/Password (Supabase Auth)", spacing: { after: 100 } }),
      new Paragraph({ text: "Workflow d'inscription:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Utilisateur remplit Auth.tsx", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Appel supabase.auth.signUp()", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Création dans auth.users (Supabase)", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Trigger on_user_created:", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Création profil dans 'profiles'", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Attribution user_type (candidat par défaut)", spacing: { after: 30 } }),
      new Paragraph({ text: "   - Initialisation credits_balance = 0", spacing: { after: 50 } }),
      new Paragraph({ text: "5. Email vérification envoyé", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Redirection dashboard selon user_type", spacing: { after: 100 } }),
      new Paragraph({ text: "Workflow de connexion:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Utilisateur saisit email/password", spacing: { after: 30 } }),
      new Paragraph({ text: "2. Appel supabase.auth.signInWithPassword()", spacing: { after: 30 } }),
      new Paragraph({ text: "3. Vérification credentials", spacing: { after: 30 } }),
      new Paragraph({ text: "4. Récupération profil depuis 'profiles'", spacing: { after: 30 } }),
      new Paragraph({ text: "5. Stockage session (JWT token)", spacing: { after: 30 } }),
      new Paragraph({ text: "6. Mise en contexte AuthContext", spacing: { after: 30 } }),
      new Paragraph({ text: "7. Redirection dashboard approprié", spacing: { after: 200 } }),

      new Paragraph({
        text: "10.2 Row Level Security (RLS)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Principe: Politiques SQL au niveau base de données", spacing: { after: 100 } }),
      new Paragraph({ text: "Types de politiques:", spacing: { after: 50 } }),
      new Paragraph({ text: "1. Public read:", spacing: { after: 30 } }),
      new Paragraph({ text: "   SELECT sur jobs, formations, blog (status = published)", spacing: { after: 50 } }),
      new Paragraph({ text: "2. Own data:", spacing: { after: 30 } }),
      new Paragraph({ text: "   candidate_profiles WHERE user_id = auth.uid()", spacing: { after: 30 } }),
      new Paragraph({ text: "   applications WHERE candidate_id = auth.uid()", spacing: { after: 50 } }),
      new Paragraph({ text: "3. Role-based:", spacing: { after: 30 } }),
      new Paragraph({ text: "   recruiter_profiles WHERE user_type = 'recruiter'", spacing: { after: 30 } }),
      new Paragraph({ text: "   AdminSEO WHERE user_type = 'admin'", spacing: { after: 50 } }),
      new Paragraph({ text: "4. Premium features:", spacing: { after: 30 } }),
      new Paragraph({ text: "   ai_premium_services WHERE has_premium_subscription()", spacing: { after: 50 } }),
      new Paragraph({ text: "5. Purchased access:", spacing: { after: 30 } }),
      new Paragraph({ text: "   profile_details WHERE profile_id IN (SELECT ... FROM profile_purchases)", spacing: { after: 200 } }),

      new Paragraph({
        text: "10.3 Sécurité des données sensibles",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "CVthèque anonymisation:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Nom complet masqué", spacing: { after: 30 } }),
      new Paragraph({ text: "• Email masqué", spacing: { after: 30 } }),
      new Paragraph({ text: "• Téléphone masqué", spacing: { after: 30 } }),
      new Paragraph({ text: "• Adresse complète masquée (ville seule visible)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Photo de profil floue", spacing: { after: 30 } }),
      new Paragraph({ text: "• Déverrouillage après achat uniquement", spacing: { after: 100 } }),
      new Paragraph({ text: "Logs de sécurité:", spacing: { after: 50 } }),
      new Paragraph({ text: "• security_logs : Toutes actions sensibles", spacing: { after: 30 } }),
      new Paragraph({ text: "• Tentatives connexion échouées", spacing: { after: 30 } }),
      new Paragraph({ text: "• Modifications profils importants", spacing: { after: 30 } }),
      new Paragraph({ text: "• Achats et paiements", spacing: { after: 30 } }),
      new Paragraph({ text: "• Utilisation IA suspecte", spacing: { after: 100 } }),
      new Paragraph({ text: "Validation inputs:", spacing: { after: 50 } }),
      new Paragraph({ text: "• Sanitization XSS (purify.es)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Validation TypeScript stricte", spacing: { after: 30 } }),
      new Paragraph({ text: "• Rate limiting API", spacing: { after: 30 } }),
      new Paragraph({ text: "• CSRF protection", spacing: { after: 200 } }),

      new Paragraph({
        text: "10.4 Gestion des permissions",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "Hiérarchie user_type:", spacing: { after: 50 } }),
      new Paragraph({ text: "• candidate : Accès basique (chercher emploi, postuler)", spacing: { after: 30 } }),
      new Paragraph({ text: "• recruiter : Accès recruteur (publier offres, CVthèque)", spacing: { after: 30 } }),
      new Paragraph({ text: "• trainer : Accès formateur (publier formations)", spacing: { after: 30 } }),
      new Paragraph({ text: "• admin : Accès total (gestion plateforme)", spacing: { after: 100 } }),
      new Paragraph({ text: "Vérifications côté frontend:", spacing: { after: 50 } }),
      new Paragraph({ text: "• AuthContext expose user.user_type", spacing: { after: 30 } }),
      new Paragraph({ text: "• Routes protégées par user_type", spacing: { after: 30 } }),
      new Paragraph({ text: "• UI conditionnelle (buttons, menus)", spacing: { after: 100 } }),
      new Paragraph({ text: "Vérifications côté backend:", spacing: { after: 50 } }),
      new Paragraph({ text: "• RLS policies vérifient auth.uid() et user_type", spacing: { after: 30 } }),
      new Paragraph({ text: "• Edge Functions vérifient JWT", spacing: { after: 30 } }),
      new Paragraph({ text: "• Services TypeScript appellent RLS-protected tables", spacing: { after: 200 } }),

      // FIN DU DOCUMENT
      new Paragraph({
        text: "CONCLUSION",
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        text: "JobGuinée est une plateforme complète et robuste combinant ATS professionnel, CVthèque, services IA, et solutions B2B. L'architecture technique est moderne (React/TypeScript/Supabase), scalable, et sécurisée avec RLS.",
        spacing: { after: 200 }
      }),
      new Paragraph({
        text: "Points forts techniques:",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "✓ 100+ tables avec RLS complet", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ 50+ services métier modulaires", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ SEO multilingue nouvelle génération", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ IA template-based économique", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ Système crédits flexible", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ ATS complet avec workflow Kanban", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ CVthèque avec anonymisation", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ Abonnements Premium multi-tiers", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ Mobile-first optimisé Afrique", spacing: { after: 30 } }),
      new Paragraph({ text: "✓ Sécurité production-ready", spacing: { after: 200 } }),

      new Paragraph({
        text: "Évolutions futures:",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 }
      }),
      new Paragraph({ text: "• Intégration LLM (Claude/GPT) pour IA avancée", spacing: { after: 30 } }),
      new Paragraph({ text: "• Google Search Console / GA4 API", spacing: { after: 30 } }),
      new Paragraph({ text: "• Application mobile native (React Native)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Messagerie temps réel (WebSockets)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Visioconférence intégrée (entretiens)", spacing: { after: 30 } }),
      new Paragraph({ text: "• Multilingue étendu (AR, PT, SW)", spacing: { after: 200 } }),

      new Paragraph({
        text: "___________________________________",
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 100 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Document généré automatiquement",
            italics: true,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: "JobGuinée © 2024 - Tous droits réservés",
            italics: true,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/tmp/cc-agent/61845223/project/JOBGUINEE_DOCUMENTATION_TECHNIQUE_COMPLETE.docx', buffer);
  console.log('✅ Document DOCX généré avec succès!');
  console.log('📄 Fichier: JOBGUINEE_DOCUMENTATION_TECHNIQUE_COMPLETE.docx');
  console.log('📊 Taille: ~100 pages');
});
