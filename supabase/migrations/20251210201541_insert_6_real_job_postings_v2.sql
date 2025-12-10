/*
  # Insert 6 Real Job Postings

  1. Job Postings Created
    - Ingénieur Génie Civil - Projets Miniers (Mining Corp Guinée)
    - Responsable HSE - Secteur Minier (Bauxite International)
    - Chef de Projet Digital Marketing (Digital Guinée Agency)
    - Développeur Full Stack React/Node.js (TechHub Africa)
    - Responsable Ressources Humaines (Groupe Industriel Guinéen)
    - Comptable Senior (Finance Solutions Guinée)
  
  2. Features
    - Complete job descriptions with requirements, responsibilities, benefits
    - Realistic salary ranges
    - Proper deadline dates
    - Featured and urgent flags
    - Keywords and languages for search
*/

-- Insert jobs for the 6 companies
INSERT INTO public.jobs (
  user_id, company_id, title, description, requirements, responsibilities, benefits,
  location, contract_type, sector, experience_level, education_level,
  diploma_required, salary_min, salary_max, status, deadline,
  is_featured, is_urgent, views_count, applications_count,
  nationality_required, languages, keywords
)
VALUES 
  -- Job 1: Ingénieur Génie Civil (Mining Corp Guinée)
  (
    (SELECT profile_id FROM companies WHERE name = 'Mining Corp Guinée'),
    (SELECT id FROM companies WHERE name = 'Mining Corp Guinée'),
    'Ingénieur Génie Civil - Projets Miniers',
    'Nous recherchons un ingénieur civil expérimenté pour superviser nos projets d''infrastructure minière. Vous serez responsable de la conception, de la planification et de la supervision des travaux de construction dans nos sites miniers. Ce poste clé nécessite une expertise en BTP et une connaissance approfondie des normes de construction internationales.',
    E'• Master en Génie Civil ou équivalent\n• 5 à 10 ans d''expérience en projets miniers\n• Maîtrise AutoCAD et logiciels de conception 3D\n• Connaissance normes ISO et réglementations minières\n• Excellentes compétences en gestion de projet\n• Français et Anglais courants',
    E'• Concevoir et superviser les infrastructures minières\n• Gérer les équipes de construction (30-50 personnes)\n• Assurer la conformité aux normes de sécurité\n• Optimiser les coûts et délais des projets\n• Coordonner avec les parties prenantes\n• Rédiger rapports techniques et suivis de chantier',
    E'• Salaire compétitif (15-25M GNF)\n• Assurance santé complète\n• Logement de fonction\n• Véhicule de service\n• Formation continue\n• Environnement international',
    'Conakry',
    'CDI',
    'Mines et Carrières',
    '5-10 ans',
    'Master',
    'Diplôme d''Ingénieur en Génie Civil',
    15000000,
    25000000,
    'published',
    CURRENT_DATE + INTERVAL '14 days',
    true,
    false,
    156,
    24,
    'Tous',
    ARRAY['Français', 'Anglais'],
    ARRAY['génie civil', 'btp', 'mines', 'autocad', 'gestion projet']
  ),
  
  -- Job 2: Responsable HSE (Bauxite International)
  (
    (SELECT profile_id FROM companies WHERE name = 'Bauxite International'),
    (SELECT id FROM companies WHERE name = 'Bauxite International'),
    'Responsable HSE - Secteur Minier',
    'Poste stratégique pour assurer la sécurité et la conformité environnementale de nos opérations minières. Pilotez les programmes HSE, formez les équipes et garantissez le respect des normes internationales. Vous travaillerez sur notre site de Kamsar avec une équipe de 10 techniciens HSE.',
    E'• Master HSE ou équivalent\n• 7 à 15 ans d''expérience en HSE secteur minier\n• Certifications ISO 45001, ISO 14001\n• Expérience audit et conformité réglementaire\n• Leadership et capacité à former des équipes\n• Maîtrise français et anglais technique',
    E'• Développer et mettre en œuvre politique HSE\n• Conduire audits de sécurité réguliers\n• Former et sensibiliser 500+ employés\n• Gérer incidents et enquêter sur accidents\n• Assurer conformité réglementaire environnementale\n• Reporting mensuel à la direction',
    E'• Package salarial attractif (12-18M GNF)\n• Prime annuelle de performance\n• Assurance santé famille\n• Logement fourni à Kamsar\n• Formation certifiante internationale\n• Plan de carrière établi',
    'Kamsar',
    'CDI',
    'Mines et Carrières',
    '7-15 ans',
    'Master',
    'Master HSE ou équivalent',
    12000000,
    18000000,
    'published',
    CURRENT_DATE + INTERVAL '21 days',
    true,
    false,
    98,
    18,
    'Tous',
    ARRAY['Français', 'Anglais'],
    ARRAY['hse', 'sécurité', 'environnement', 'iso 45001', 'mines']
  ),
  
  -- Job 3: Chef de Projet Digital Marketing (Digital Guinée Agency)
  (
    (SELECT profile_id FROM companies WHERE name = 'Digital Guinée Agency'),
    (SELECT id FROM companies WHERE name = 'Digital Guinée Agency'),
    'Chef de Projet Digital Marketing',
    'Pilotez notre transformation digitale et développez notre présence en ligne. Concevez et déployez des campagnes marketing innovantes sur tous les canaux digitaux (réseaux sociaux, SEO, emailing). Poste basé à Conakry avec possibilité de télétravail partiel.',
    E'• Licence Marketing Digital / Communication\n• 3 à 5 ans expérience marketing digital\n• Maîtrise SEO/SEM, Google Ads, Facebook Ads\n• Excellentes compétences analytiques (Google Analytics)\n• Portfolio de campagnes réussies\n• Créativité et sens de l''innovation',
    E'• Élaborer stratégie marketing digital globale\n• Gérer campagnes multi-canaux (SEO, SEM, Social Media)\n• Créer contenu engageant (textes, visuels, vidéos)\n• Analyser performances et optimiser ROI\n• Manager équipe de 3 digital marketers\n• Gérer budget marketing (50M GNF/an)',
    E'• Salaire: 8-12M GNF\n• Bonus sur objectifs\n• Télétravail 2 jours/semaine\n• Formation continue certifiée Google/Facebook\n• Environnement startup dynamique\n• Matériel professionnel fourni',
    'Conakry',
    'CDI',
    'Technologies',
    '3-5 ans',
    'Licence',
    'Licence Marketing Digital / Communication',
    8000000,
    12000000,
    'published',
    CURRENT_DATE + INTERVAL '10 days',
    false,
    true,
    203,
    31,
    'Tous',
    ARRAY['Français'],
    ARRAY['marketing digital', 'seo', 'social media', 'google ads', 'analytics']
  ),
  
  -- Job 4: Développeur Full Stack (TechHub Africa)
  (
    (SELECT profile_id FROM companies WHERE name = 'TechHub Africa'),
    (SELECT id FROM companies WHERE name = 'TechHub Africa'),
    'Développeur Full Stack React/Node.js',
    'Rejoignez notre équipe tech pour construire des solutions innovantes. Développez des applications web modernes avec React, Node.js et les technologies cloud les plus récentes. Environnement agile, projets stimulants pour clients internationaux.',
    E'• Licence Informatique / Développement Web\n• 2 à 4 ans expérience développement web\n• Maîtrise React.js, Node.js, Express\n• Connaissance PostgreSQL, MongoDB\n• Expérience API REST, Git, Docker\n• Anglais technique requis',
    E'• Développer applications web full-stack\n• Concevoir et implémenter APIs REST\n• Optimiser performances et sécurité\n• Participer aux code reviews\n• Collaborer en méthodologie Agile/Scrum\n• Documenter code et architecture technique',
    E'• Salaire: 6-9M GNF\n• CDD 12 mois renouvelable\n• Télétravail flexible\n• Formation continue technologies\n• Projets clients internationaux\n• MacBook Pro fourni',
    'Conakry (Télétravail possible)',
    'CDD',
    'Technologies',
    '2-4 ans',
    'Licence',
    'Licence Informatique / Développement Web',
    6000000,
    9000000,
    'published',
    CURRENT_DATE + INTERVAL '30 days',
    false,
    false,
    45,
    12,
    'Tous',
    ARRAY['Français', 'Anglais'],
    ARRAY['react', 'nodejs', 'javascript', 'postgresql', 'api rest']
  ),
  
  -- Job 5: Responsable RH (Groupe Industriel Guinéen)
  (
    (SELECT profile_id FROM companies WHERE name = 'Groupe Industriel Guinéen'),
    (SELECT id FROM companies WHERE name = 'Groupe Industriel Guinéen'),
    'Responsable Ressources Humaines',
    'Dirigez la fonction RH de notre organisation en pleine croissance. Recrutement, formation, gestion des talents, relations sociales et conformité légale au Code du Travail guinéen. Vous superviserez une équipe RH de 5 personnes et gérerez 300+ employés.',
    E'• Master RH / Gestion des Ressources Humaines\n• 5 à 10 ans expérience fonction RH\n• Connaissance approfondie Code du Travail guinéen\n• Maîtrise SIRH et outils RH digitaux\n• Excellentes compétences relationnelles\n• Leadership et capacité à gérer conflits',
    E'• Définir et mettre en œuvre stratégie RH\n• Piloter recrutement tous niveaux (50+ postes/an)\n• Développer plans de formation et carrière\n• Gérer relations sociales et dialogue partenaires\n• Assurer conformité légale et réglementaire\n• Manager équipe RH (5 personnes)',
    E'• Package: 10-15M GNF\n• Primes trimestrielles\n• Assurance santé premium\n• Véhicule de fonction\n• Formation RH internationale\n• Participation aux bénéfices',
    'Conakry',
    'CDI',
    'Ressources Humaines',
    '5-10 ans',
    'Master',
    'Master RH / Gestion des Ressources Humaines',
    10000000,
    15000000,
    'published',
    CURRENT_DATE + INTERVAL '20 days',
    false,
    false,
    134,
    27,
    'Tous',
    ARRAY['Français'],
    ARRAY['ressources humaines', 'recrutement', 'formation', 'sirh', 'droit travail']
  ),
  
  -- Job 6: Comptable Senior (Finance Solutions Guinée)
  (
    (SELECT profile_id FROM companies WHERE name = 'Finance Solutions Guinée'),
    (SELECT id FROM companies WHERE name = 'Finance Solutions Guinée'),
    'Comptable Senior',
    'Gérez la comptabilité générale et analytique de notre cabinet. Établissez les états financiers, supervisez la trésorerie et assurez la conformité fiscale selon la réglementation guinéenne. Vous travaillerez sur un portefeuille de 20+ clients entreprises.',
    E'• Licence Comptabilité / Finance\n• 3 à 7 ans expérience comptabilité cabinet\n• Maîtrise SYSCOHADA et fiscalité guinéenne\n• Expertise logiciels comptables (Sage, Ciel)\n• Rigueur et sens de l''organisation\n• Capacité à gérer plusieurs dossiers',
    E'• Tenir comptabilité générale clients (20+ PME)\n• Établir bilans, comptes de résultat, annexes\n• Gérer déclarations fiscales et sociales\n• Superviser trésorerie et rapprochements bancaires\n• Conseiller clients sur optimisation fiscale\n• Former juniors comptables (2 personnes)',
    E'• Salaire: 7-11M GNF\n• Bonus annuel performance\n• Assurance santé\n• Formation certifiante continue\n• Cabinet reconnu en Guinée\n• Évolution vers manager',
    'Conakry',
    'CDI',
    'Finance et Banque',
    '3-7 ans',
    'Licence',
    'Licence Comptabilité / Finance',
    7000000,
    11000000,
    'published',
    CURRENT_DATE + INTERVAL '25 days',
    false,
    false,
    87,
    19,
    'Tous',
    ARRAY['Français'],
    ARRAY['comptabilité', 'syscohada', 'fiscalité', 'sage', 'finance']
  )
ON CONFLICT DO NOTHING;
