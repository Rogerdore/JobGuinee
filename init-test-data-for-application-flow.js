/**
 * INITIALISATION DES DONNÉES DE TEST
 *
 * Ce script crée :
 * 1. Un profil candidat de test
 * 2. Une entreprise de test
 * 3. Une offre d'emploi de test
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

console.log('\n🔧 INITIALISATION DES DONNÉES DE TEST\n');

async function init() {
  // Créer un profil candidat
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      email: 'test.candidat@jobguinee.com',
      full_name: 'Test Candidat',
      user_type: 'candidate',
      phone: '+224 600 000 001'
    })
    .select()
    .single();

  if (profileError) {
    console.log('❌ Erreur création profil:', profileError.message);

    // Essayer de récupérer un profil existant
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      console.log('✓ Utilisation d\'un profil existant');
      console.log(`  ID: ${existing.id}\n`);
      return;
    }

    console.log('\n⚠️  La base de données ne contient aucun profil.');
    console.log('💡 Conseil : Créez un utilisateur via l\'interface d\'inscription\n');
    return;
  }

  console.log('✓ Profil candidat créé');
  console.log(`  ID: ${profile.id}`);
  console.log(`  Email: ${profile.email}\n`);

  // Créer une entreprise
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name: 'Entreprise Test',
      profile_id: profile.id,
      industry: 'Technologie',
      size: '50-200',
      website: 'https://test.com'
    })
    .select()
    .single();

  if (companyError) {
    console.log('❌ Erreur création entreprise:', companyError.message);
    return;
  }

  console.log('✓ Entreprise créée');
  console.log(`  Nom: ${company.name}\n`);

  // Créer une offre
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      title: 'Développeur Full Stack Test',
      company_id: company.id,
      description: 'Poste de test pour validation du système de candidature',
      location: 'Conakry, Guinée',
      job_type: 'CDI',
      salary_min: 5000000,
      salary_max: 10000000,
      status: 'published',
      required_skills: ['JavaScript', 'React', 'Node.js']
    })
    .select()
    .single();

  if (jobError) {
    console.log('❌ Erreur création offre:', jobError.message);
    return;
  }

  console.log('✓ Offre créée');
  console.log(`  Titre: ${job.title}`);
  console.log(`  ID: ${job.id}\n`);

  console.log('✅ Données de test créées avec succès !\n');
  console.log('Vous pouvez maintenant lancer : node test-application-flow-with-setup.js\n');
}

init().catch(console.error);
