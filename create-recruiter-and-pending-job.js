import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function createRecruiterAndJob() {
  try {
    console.log('🚀 Création d\'un recruteur et d\'une offre de test...\n');

    // Créer un utilisateur recruteur
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'recruteur.test@miningcorp.gn',
      password: 'Test123456!',
      email_confirm: true,
      user_metadata: {
        user_type: 'recruiter',
        full_name: 'Roger Doré'
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  Le recruteur existe déjà, récupération du profil...');

        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .eq('email', 'recruteur.test@miningcorp.gn')
          .single();

        if (existingProfile) {
          console.log('✅ Recruteur trouvé:', existingProfile.full_name);
          await createPendingJob(existingProfile.id);
        }
        return;
      } else {
        console.error('❌ Erreur création utilisateur:', authError);
        return;
      }
    }

    const userId = authData.user.id;
    console.log('✅ Utilisateur créé:', authData.user.email);

    // Créer le profil
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: 'recruteur.test@miningcorp.gn',
        full_name: 'Roger Doré',
        user_type: 'recruiter'
      });

    if (profileError) {
      console.error('❌ Erreur création profil:', profileError);
      return;
    }

    console.log('✅ Profil recruteur créé\n');

    await createPendingJob(userId);

  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

async function createPendingJob(userId) {
  console.log('📝 Création d\'une offre en attente...');

  const { data: newJob, error: createError } = await supabaseAdmin
    .from('jobs')
    .insert({
      user_id: userId,
      title: 'Comptable Junior',
      description: `Mining Guinée Corp recherche un Comptable Junior pour rejoindre son équipe financière.

**Responsabilités:**
- Enregistrement des opérations comptables courantes
- Rapprochement bancaire mensuel
- Préparation des déclarations fiscales
- Assistance dans la clôture mensuelle

**Profil recherché:**
- Diplôme en comptabilité (Bac+2 minimum)
- 1-2 ans d'expérience
- Maîtrise des logiciels comptables
- Rigueur et sens de l'organisation`,
      location: 'Conakry',
      contract_type: 'CDI',
      sector: 'Finance',
      salary_range: '800000-1200000',
      department: 'Mining Guinée Corp.',
      category: 'Comptabilité',
      position_count: 1,
      experience_level: '1-2 ans',
      education_level: 'Bac+2',
      status: 'pending',
      submitted_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Erreur création offre:', createError);
    return;
  }

  console.log('✅ Offre "pending" créée avec succès!');
  console.log(`   ID: ${newJob.id}`);
  console.log(`   Titre: ${newJob.title}`);
  console.log(`   Status: ${newJob.status}`);
  console.log(`\n💡 Rechargez la page de modération pour voir l'offre!`);
  console.log(`\n📧 Identifiants recruteur:`);
  console.log(`   Email: recruteur.test@miningcorp.gn`);
  console.log(`   Mot de passe: Test123456!`);
}

createRecruiterAndJob();
