require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const companies = [
  {
    email: 'recruteur@miningcorp.gn',
    password: 'Recruiter2024!',
    full_name: 'Mamadou Diallo',
    phone: '+224 620 10 20 30',
    company: {
      name: 'Mining Corp Guinée',
      description: 'Leader dans l\'exploitation minière en Guinée avec plus de 20 ans d\'expérience. Nous opérons plusieurs sites d\'extraction de bauxite et participons activement au développement économique du pays.',
      logo_url: 'https://ui-avatars.com/api/?name=Mining+Corp&background=0E2F56&color=fff&size=200&bold=true',
      website: 'https://www.miningcorp.gn',
      industry: 'Mines et Carrières',
      location: 'Conakry',
      size: '500+'
    },
    job: {
      title: 'Ingénieur Génie Civil - Projets Miniers',
      description: 'Nous recherchons un ingénieur civil expérimenté pour superviser nos projets d\'infrastructure minière. Vous serez responsable de la conception, de la planification et de la supervision des travaux de construction dans nos sites miniers.',
      requirements: 'Master en Génie Civil ou équivalent\nExpérience de 5 à 10 ans en projets miniers\nMaîtrise AutoCAD et logiciels de conception 3D\nConnaissance des normes ISO et réglementations minières\nExcellentes compétences en gestion de projet\nFrançais et Anglais courants',
      responsibilities: 'Concevoir et superviser les infrastructures minières\nGérer les équipes de construction (30-50 personnes)\nAssurer la conformité aux normes de sécurité\nOptimiser les coûts et délais des projets\nCoordination avec les parties prenantes\nRédaction de rapports techniques',
      benefits: 'Salaire compétitif (15-25M GNF)\nAssurance santé complète\nLogement de fonction\nVéhicule de service\nFormation continue\nEnvironnement international',
      location: 'Conakry',
      contract_type: 'CDI',
      sector: 'Mines et Carrières',
      experience_level: '5-10 ans',
      education_level: 'Master',
      diploma_required: 'Diplôme d\'Ingénieur en Génie Civil',
      salary_min: 15000000,
      salary_max: 25000000,
      deadline_days: 14,
      is_featured: true,
      is_urgent: false,
      nationality_required: 'Tous',
      languages: ['Français', 'Anglais'],
      keywords: ['génie civil', 'btp', 'mines', 'autocad', 'gestion projet']
    }
  },
  {
    email: 'recruteur@bauxite-int.gn',
    password: 'Recruiter2024!',
    full_name: 'Aïssatou Baldé',
    phone: '+224 621 11 21 31',
    company: {
      name: 'Bauxite International',
      description: 'Entreprise internationale spécialisée dans l\'extraction et le raffinage de bauxite. Nous appliquons les normes HSE internationales les plus strictes.',
      logo_url: 'https://ui-avatars.com/api/?name=Bauxite+Int&background=059669&color=fff&size=200&bold=true',
      website: 'https://www.bauxite-int.com',
      industry: 'Mines et Carrières',
      location: 'Kamsar',
      size: '200-500'
    },
    job: {
      title: 'Responsable HSE - Secteur Minier',
      description: 'Poste stratégique pour assurer la sécurité et la conformité environnementale de nos opérations minières. Pilotez les programmes HSE, formez les équipes et garantissez le respect des normes internationales.',
      requirements: 'Master HSE ou équivalent\n7 à 15 ans d\'expérience en HSE secteur minier\nCertifications ISO 45001, ISO 14001\nExpérience en audit et conformité réglementaire\nLeadership et capacité à former des équipes\nMaîtrise français et anglais technique',
      responsibilities: 'Développer et mettre en œuvre la politique HSE\nConduire des audits de sécurité réguliers\nFormer et sensibiliser 500+ employés\nGérer les incidents et enquêter sur les accidents\nAssurer la conformité réglementaire environnementale\nReporting mensuel à la direction',
      benefits: 'Package salarial attractif (12-18M GNF)\nPrime annuelle de performance\nAssurance santé famille\nLogement fourni à Kamsar\nFormation certifiante internationale\nPlan de carrière établi',
      location: 'Kamsar',
      contract_type: 'CDI',
      sector: 'Mines et Carrières',
      experience_level: '7-15 ans',
      education_level: 'Master',
      diploma_required: 'Master HSE ou équivalent',
      salary_min: 12000000,
      salary_max: 18000000,
      deadline_days: 21,
      is_featured: true,
      is_urgent: false,
      nationality_required: 'Tous',
      languages: ['Français', 'Anglais'],
      keywords: ['hse', 'sécurité', 'environnement', 'iso 45001', 'mines']
    }
  },
  {
    email: 'contact@digitalgn.com',
    password: 'Recruiter2024!',
    full_name: 'Ibrahima Sylla',
    phone: '+224 622 12 22 32',
    company: {
      name: 'Digital Guinée Agency',
      description: 'Agence digitale innovante proposant des solutions marketing complètes pour les entreprises guinéennes. Stratégie digitale, création de contenu, gestion de campagnes.',
      logo_url: 'https://ui-avatars.com/api/?name=Digital+Agency&background=FF8C00&color=fff&size=200&bold=true',
      website: 'https://www.digitalgn.com',
      industry: 'Technologies',
      location: 'Conakry',
      size: '20-50'
    },
    job: {
      title: 'Chef de Projet Digital Marketing',
      description: 'Pilotez notre transformation digitale et développez notre présence en ligne. Concevez et déployez des campagnes marketing innovantes sur tous les canaux digitaux.',
      requirements: 'Licence Marketing Digital / Communication\n3 à 5 ans d\'expérience en marketing digital\nMaîtrise SEO/SEM, Google Ads, Facebook Ads\nExcellentes compétences analytiques (Google Analytics)\nPortfolio de campagnes réussies\nCréativité et sens de l\'innovation',
      responsibilities: 'Élaborer la stratégie marketing digital globale\nGérer des campagnes multi-canaux\nCréer du contenu engageant\nAnalyser les performances et optimiser le ROI\nManager une équipe de 3 digital marketers\nGérer le budget marketing',
      benefits: 'Salaire: 8-12M GNF\nBonus sur objectifs\nTélétravail 2 jours/semaine\nFormation continue certifiée Google/Facebook\nEnvironnement startup dynamique\nMatériel professionnel fourni',
      location: 'Conakry',
      contract_type: 'CDI',
      sector: 'Technologies',
      experience_level: '3-5 ans',
      education_level: 'Licence',
      diploma_required: 'Licence Marketing Digital / Communication',
      salary_min: 8000000,
      salary_max: 12000000,
      deadline_days: 10,
      is_featured: false,
      is_urgent: true,
      nationality_required: 'Tous',
      languages: ['Français'],
      keywords: ['marketing digital', 'seo', 'social media', 'google ads', 'analytics']
    }
  },
  {
    email: 'jobs@techhub.africa',
    password: 'Recruiter2024!',
    full_name: 'Fatoumata Camara',
    phone: '+224 623 13 23 33',
    company: {
      name: 'TechHub Africa',
      description: 'Hub technologique dédié à l\'innovation et au développement logiciel en Afrique de l\'Ouest. Nous créons des solutions digitales qui transforment les entreprises.',
      logo_url: 'https://ui-avatars.com/api/?name=TechHub&background=8B5CF6&color=fff&size=200&bold=true',
      website: 'https://www.techhub.africa',
      industry: 'Technologies',
      location: 'Conakry',
      size: '50-100'
    },
    job: {
      title: 'Développeur Full Stack React/Node.js',
      description: 'Rejoignez notre équipe tech pour construire des solutions innovantes. Développez des applications web modernes avec React, Node.js et les technologies cloud les plus récentes.',
      requirements: 'Licence Informatique / Développement Web\n2 à 4 ans d\'expérience en développement web\nMaîtrise React.js, Node.js, Express\nConnaissance PostgreSQL, MongoDB\nExpérience API REST, Git, Docker\nAnglais technique requis',
      responsibilities: 'Développer des applications web full-stack\nConcevoir et implémenter des APIs REST\nOptimiser les performances et la sécurité\nParticiper aux code reviews\nCollaborer en méthodologie Agile/Scrum\nDocumenter le code et l\'architecture technique',
      benefits: 'Salaire: 6-9M GNF\nCDD 12 mois renouvelable\nTélétravail flexible\nFormation continue technologies\nProjets clients internationaux\nMacBook Pro fourni',
      location: 'Conakry (Télétravail possible)',
      contract_type: 'CDD',
      sector: 'Technologies',
      experience_level: '2-4 ans',
      education_level: 'Licence',
      diploma_required: 'Licence Informatique / Développement Web',
      salary_min: 6000000,
      salary_max: 9000000,
      deadline_days: 30,
      is_featured: false,
      is_urgent: false,
      nationality_required: 'Tous',
      languages: ['Français', 'Anglais'],
      keywords: ['react', 'nodejs', 'javascript', 'postgresql', 'api rest']
    }
  },
  {
    email: 'rh@groupeig.gn',
    password: 'Recruiter2024!',
    full_name: 'Alpha Condé',
    phone: '+224 624 14 24 34',
    company: {
      name: 'Groupe Industriel Guinéen',
      description: 'Conglomérat industriel diversifié opérant dans plusieurs secteurs: agroalimentaire, manufacture, distribution. Plus de 30 ans de présence en Guinée.',
      logo_url: 'https://ui-avatars.com/api/?name=GIG&background=DC2626&color=fff&size=200&bold=true',
      website: 'https://www.groupeig.gn',
      industry: 'Industrie',
      location: 'Conakry',
      size: '500+'
    },
    job: {
      title: 'Responsable Ressources Humaines',
      description: 'Dirigez la fonction RH de notre organisation en pleine croissance. Recrutement, formation, gestion des talents, relations sociales et conformité légale au Code du Travail guinéen.',
      requirements: 'Master RH / Gestion des Ressources Humaines\n5 à 10 ans d\'expérience en fonction RH\nConnaissance approfondie du Code du Travail guinéen\nMaîtrise des SIRH et outils RH digitaux\nExcellentes compétences relationnelles\nLeadership et capacité à gérer les conflits',
      responsibilities: 'Définir et mettre en œuvre la stratégie RH\nPiloter le recrutement tous niveaux\nDévelopper les plans de formation et carrière\nGérer les relations sociales\nAssurer la conformité légale et réglementaire\nManager l\'équipe RH (5 personnes)',
      benefits: 'Package: 10-15M GNF\nPrimes trimestrielles\nAssurance santé premium\nVéhicule de fonction\nFormation RH internationale\nParticipation aux bénéfices',
      location: 'Conakry',
      contract_type: 'CDI',
      sector: 'Ressources Humaines',
      experience_level: '5-10 ans',
      education_level: 'Master',
      diploma_required: 'Master RH / Gestion des Ressources Humaines',
      salary_min: 10000000,
      salary_max: 15000000,
      deadline_days: 20,
      is_featured: false,
      is_urgent: false,
      nationality_required: 'Tous',
      languages: ['Français'],
      keywords: ['ressources humaines', 'recrutement', 'formation', 'sirh', 'droit travail']
    }
  },
  {
    email: 'direction@financesol.gn',
    password: 'Recruiter2024!',
    full_name: 'Hadja Bah',
    phone: '+224 625 15 25 35',
    company: {
      name: 'Finance Solutions Guinée',
      description: 'Cabinet de conseil en finance et comptabilité offrant des services d\'audit, de conseil fiscal et de gestion financière aux entreprises guinéennes.',
      logo_url: 'https://ui-avatars.com/api/?name=Finance+Solutions&background=10B981&color=fff&size=200&bold=true',
      website: 'https://www.financesol.gn',
      industry: 'Finance et Banque',
      location: 'Conakry',
      size: '50-100'
    },
    job: {
      title: 'Comptable Senior',
      description: 'Gérez la comptabilité générale et analytique de notre cabinet. Établissez les états financiers, supervisez la trésorerie et assurez la conformité fiscale selon la réglementation guinéenne.',
      requirements: 'Licence Comptabilité / Finance\n3 à 7 ans d\'expérience en comptabilité cabinet\nMaîtrise du SYSCOHADA et fiscalité guinéenne\nExpertise logiciels comptables (Sage, Ciel)\nRigueur et sens de l\'organisation\nCapacité à gérer plusieurs dossiers',
      responsibilities: 'Tenir la comptabilité générale des clients\nÉtablir les bilans et comptes de résultat\nGérer les déclarations fiscales et sociales\nSuperviser la trésorerie\nConseiller les clients sur l\'optimisation fiscale\nFormer les juniors comptables',
      benefits: 'Salaire: 7-11M GNF\nBonus annuel performance\nAssurance santé\nFormation certifiante continue\nCabinet reconnu en Guinée\nÉvolution vers manager',
      location: 'Conakry',
      contract_type: 'CDI',
      sector: 'Finance et Banque',
      experience_level: '3-7 ans',
      education_level: 'Licence',
      diploma_required: 'Licence Comptabilité / Finance',
      salary_min: 7000000,
      salary_max: 11000000,
      deadline_days: 25,
      is_featured: false,
      is_urgent: false,
      nationality_required: 'Tous',
      languages: ['Français'],
      keywords: ['comptabilité', 'syscohada', 'fiscalité', 'sage', 'finance']
    }
  }
];

async function createRecruiterWithJob(data) {
  console.log(`\n📧 Creating account: ${data.email}`);

  // 1. Create user account
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.full_name
    }
  });

  if (authError) {
    console.error(`❌ Error creating user ${data.email}:`, authError.message);
    return null;
  }

  console.log(`✅ User created: ${authData.user.id}`);
  const userId = authData.user.id;

  // 2. Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      user_type: 'recruiter',
      full_name: data.full_name,
      phone: data.phone,
      credits_balance: 100
    })
    .eq('id', userId);

  if (profileError) {
    console.error(`❌ Error updating profile:`, profileError.message);
  } else {
    console.log(`✅ Profile updated as recruiter`);
  }

  // 3. Create company
  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .insert({
      profile_id: userId,
      ...data.company
    })
    .select()
    .single();

  if (companyError) {
    console.error(`❌ Error creating company:`, companyError.message);
    return null;
  }

  console.log(`✅ Company created: ${companyData.name}`);

  // 4. Create job
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + data.job.deadline_days);

  const { data: jobData, error: jobError } = await supabase
    .from('jobs')
    .insert({
      company_id: companyData.id,
      ...data.job,
      deadline: deadline.toISOString().split('T')[0],
      status: 'published',
      views_count: Math.floor(Math.random() * 200),
      applications_count: Math.floor(Math.random() * 30)
    })
    .select()
    .single();

  if (jobError) {
    console.error(`❌ Error creating job:`, jobError.message);
    return null;
  }

  console.log(`✅ Job created: ${jobData.title}`);

  return {
    user: authData.user,
    company: companyData,
    job: jobData
  };
}

async function main() {
  console.log('🚀 Starting creation of 6 recruiters with companies and jobs...\n');
  console.log('=' .repeat(60));

  const results = [];

  for (const companyData of companies) {
    const result = await createRecruiterWithJob(companyData);
    if (result) {
      results.push(result);
    }
    // Small delay between creations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n✨ Completed! Created ${results.length} recruiters, companies, and jobs`);

  console.log('\n📊 Summary:');
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.company.name}`);
    console.log(`   📧 Email: ${companies[index].email}`);
    console.log(`   🔑 Password: ${companies[index].password}`);
    console.log(`   💼 Job: ${result.job.title}`);
    console.log(`   📍 Location: ${result.job.location}`);
  });

  console.log('\n🎉 All done! You can now log in with any of these accounts.');
}

main().catch(console.error);
