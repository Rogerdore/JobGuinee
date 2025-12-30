import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const getDefaultGuineaPages = () => {
  const pages = [];

  // A1. Emplois par métier (10)
  const professions = [
    { name: 'Développeur Informatique', slug: 'developpeur-informatique' },
    { name: 'Comptable', slug: 'comptable' },
    { name: 'Ingénieur Mines', slug: 'ingenieur-mines' },
    { name: 'Agent Administratif', slug: 'agent-administratif' },
    { name: 'Chargé Ressources Humaines', slug: 'charge-ressources-humaines' },
    { name: 'Chauffeur', slug: 'chauffeur' },
    { name: 'Électricien', slug: 'electricien' },
    { name: 'Technicien Réseau', slug: 'technicien-reseau' },
    { name: 'Agent Commercial', slug: 'agent-commercial' },
    { name: 'Assistant Direction', slug: 'assistant-direction' }
  ];

  professions.forEach(prof => {
    pages.push({
      page_type: 'job_by_profession',
      slug: `emplois/${prof.slug}-guinee`,
      title: `Emplois ${prof.name} en Guinée | Offres Recrutement ${prof.name} Conakry`,
      meta_description: `Trouvez des offres d'emploi ${prof.name} en Guinée. Postulez aux meilleures opportunités ${prof.name} à Conakry et dans toute la Guinée. JobGuinée, leader du recrutement.`,
      keywords: `emploi ${prof.slug} guinée, recrutement ${prof.slug} conakry, offre ${prof.slug}, job ${prof.slug} guinée`,
      h1: `Emplois ${prof.name} en Guinée`,
      introduction: `Découvrez toutes les offres d'emploi pour ${prof.name} en Guinée. JobGuinée vous connecte aux meilleures opportunités professionnelles dans le secteur.`,
      profession_name: prof.name,
      primary_cta: 'Confier un recrutement ' + prof.name,
      secondary_cta: 'Voir les offres ' + prof.name,
      is_active: true,
      schema_org: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Emplois ${prof.name} en Guinée`,
        'description': `Offres d'emploi ${prof.name} en Guinée`
      }
    });
  });

  // A2. Emplois par secteur (8)
  const sectors = [
    { name: 'Mines', slug: 'mines' },
    { name: 'BTP', slug: 'btp' },
    { name: 'Banque & Finance', slug: 'banque-finance' },
    { name: 'Télécoms', slug: 'telecoms' },
    { name: 'ONG', slug: 'ong' },
    { name: 'Éducation', slug: 'education' },
    { name: 'Santé', slug: 'sante' },
    { name: 'Logistique', slug: 'logistique' }
  ];

  sectors.forEach(sector => {
    pages.push({
      page_type: 'job_by_sector',
      slug: `emplois/secteur/${sector.slug}-guinee`,
      title: `Emplois ${sector.name} en Guinée | Recrutement Secteur ${sector.name} Conakry`,
      meta_description: `Offres d'emploi dans le secteur ${sector.name} en Guinée. Recrutement ${sector.name} à Conakry et dans toute la Guinée. Postulez maintenant sur JobGuinée.`,
      keywords: `emploi ${sector.slug} guinée, recrutement ${sector.slug}, job ${sector.slug} conakry, carrière ${sector.slug}`,
      h1: `Emplois Secteur ${sector.name} en Guinée`,
      introduction: `Explorez les opportunités d'emploi dans le secteur ${sector.name} en Guinée. Trouvez votre prochain job dans une entreprise leader du secteur.`,
      sector_name: sector.name,
      primary_cta: 'Externaliser recrutement ' + sector.name,
      secondary_cta: 'Voir offres ' + sector.name,
      is_active: true,
      schema_org: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Emplois ${sector.name} en Guinée`,
        'description': `Offres d'emploi secteur ${sector.name}`
      }
    });
  });

  // A3. Emplois par ville (6)
  const cities = [
    { name: 'Conakry', slug: 'conakry', intro: 'capitale économique' },
    { name: 'Kankan', slug: 'kankan', intro: 'deuxième ville' },
    { name: 'Labé', slug: 'labe', intro: 'ville du Fouta' },
    { name: 'Nzérékoré', slug: 'nzerekore', intro: 'ville forestière' },
    { name: 'Boké', slug: 'boke', intro: 'capitale minière' },
    { name: 'Kindia', slug: 'kindia', intro: 'carrefour commercial' }
  ];

  cities.forEach(city => {
    pages.push({
      page_type: 'job_by_city',
      slug: `emplois/${city.slug}`,
      title: `Emplois à ${city.name} Guinée | Offres Recrutement ${city.name}`,
      meta_description: `Trouvez un emploi à ${city.name}, ${city.intro} de Guinée. Offres d'emploi actualisées quotidiennement. Recrutement local ${city.name}.`,
      keywords: `emploi ${city.slug}, recrutement ${city.slug}, job ${city.slug} guinée, offre ${city.slug}`,
      h1: `Emplois à ${city.name}, Guinée`,
      introduction: `Découvrez les opportunités d'emploi à ${city.name}, ${city.intro} de Guinée. JobGuinée facilite votre recherche d'emploi local.`,
      city_name: city.name,
      primary_cta: 'Recruter à ' + city.name,
      secondary_cta: 'Voir offres ' + city.name,
      is_active: true,
      schema_org: {
        '@context': 'https://schema.org',
        '@type': 'Place',
        'name': city.name,
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': 'GN'
        }
      }
    });
  });

  // A4. Emplois par niveau (6)
  const levels = [
    { name: 'Junior', slug: 'junior', desc: '0-3 ans d\'expérience' },
    { name: 'Intermédiaire', slug: 'intermediaire', desc: '3-7 ans d\'expérience' },
    { name: 'Senior', slug: 'senior', desc: '7+ ans d\'expérience' },
    { name: 'Cadre', slug: 'cadre', desc: 'Postes de direction' },
    { name: 'Stage', slug: 'stage', desc: 'Opportunités de stage' },
    { name: 'Apprentissage', slug: 'apprentissage', desc: 'Contrats d\'apprentissage' }
  ];

  levels.forEach(level => {
    pages.push({
      page_type: 'job_by_level',
      slug: `emplois/${level.slug}-guinee`,
      title: `Emplois ${level.name} en Guinée | Offres ${level.desc}`,
      meta_description: `Offres d'emploi niveau ${level.name} en Guinée. ${level.desc}. Trouvez votre opportunité professionnelle adaptée à votre niveau d'expérience.`,
      keywords: `emploi ${level.slug} guinée, recrutement ${level.slug}, job ${level.slug}, offre ${level.slug} conakry`,
      h1: `Emplois Niveau ${level.name} en Guinée`,
      introduction: `Parcourez les offres d'emploi pour profils ${level.name} en Guinée. ${level.desc}. Postulez aux opportunités correspondant à votre expérience.`,
      level_name: level.name,
      primary_cta: 'Recruter profil ' + level.name,
      secondary_cta: 'Voir offres ' + level.name,
      is_active: true,
      schema_org: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': `Emplois ${level.name} en Guinée`
      }
    });
  });

  return pages;
};

async function initializeLandingPages() {
  console.log('🚀 Initialisation des 30 landing pages SEO pour la Guinée...\n');

  try {
    const pages = getDefaultGuineaPages();

    console.log(`📄 ${pages.length} landing pages à créer:\n`);

    // Log by type
    const byType = pages.reduce((acc, page) => {
      acc[page.page_type] = (acc[page.page_type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count} pages`);
    });

    console.log('\n💾 Insertion dans la base de données...\n');

    const { data, error } = await supabase
      .from('seo_landing_pages')
      .upsert(pages, { onConflict: 'slug' })
      .select();

    if (error) {
      throw error;
    }

    console.log(`✅ ${data.length} landing pages créées/mises à jour avec succès!\n`);

    // Display sample URLs
    console.log('📝 Exemples d\'URLs générées:\n');
    const samples = [
      pages.find(p => p.page_type === 'job_by_profession'),
      pages.find(p => p.page_type === 'job_by_sector'),
      pages.find(p => p.page_type === 'job_by_city'),
      pages.find(p => p.page_type === 'job_by_level')
    ];

    samples.forEach(page => {
      if (page) {
        console.log(`   /${page.slug}`);
        console.log(`   → ${page.title}`);
        console.log('');
      }
    });

    console.log('✨ Initialisation terminée avec succès!');
    console.log('\n📊 Statistiques:');
    console.log(`   • Total: ${data.length} pages`);
    console.log(`   • Par métier: ${byType.job_by_profession || 0}`);
    console.log(`   • Par secteur: ${byType.job_by_sector || 0}`);
    console.log(`   • Par ville: ${byType.job_by_city || 0}`);
    console.log(`   • Par niveau: ${byType.job_by_level || 0}`);
    console.log('\n🎯 Prochaines étapes:');
    console.log('   1. Accéder au dashboard admin SEO landing pages');
    console.log('   2. Personnaliser le contenu de chaque page');
    console.log('   3. Activer le tracking des conversions');
    console.log('   4. Générer des leads B2B depuis le SEO\n');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error.message);
    process.exit(1);
  }
}

initializeLandingPages();
