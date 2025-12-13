import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestNotifications() {
  console.log('🔍 Recherche de candidats...');

  // Trouver un candidat
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('user_type', 'candidate')
    .limit(1);

  if (profilesError || !profiles || profiles.length === 0) {
    console.error('❌ Aucun candidat trouvé');
    return;
  }

  const candidate = profiles[0];
  console.log(`✅ Candidat trouvé: ${candidate.full_name} (${candidate.email})`);

  // Trouver une candidature du candidat
  const { data: applications } = await supabase
    .from('applications')
    .select('id, job_id, jobs(title, companies(name))')
    .eq('candidate_id', candidate.id)
    .limit(1);

  // Créer des notifications de test
  const notifications = [];

  // Notification générale
  notifications.push({
    user_id: candidate.id,
    type: 'info',
    title: 'Bienvenue sur JobGuinée',
    message: 'Votre compte a été créé avec succès. Complétez votre profil pour augmenter vos chances de trouver un emploi.',
    read: false
  });

  notifications.push({
    user_id: candidate.id,
    type: 'success',
    title: 'Profil mis à jour',
    message: 'Votre profil a été mis à jour avec succès. Vos informations sont maintenant visibles par les recruteurs.',
    read: false
  });

  if (applications && applications.length > 0) {
    const app = applications[0];
    const jobTitle = app.jobs?.title || 'Poste';
    const companyName = app.jobs?.companies?.name || 'Entreprise';

    notifications.push({
      user_id: candidate.id,
      type: 'success',
      title: 'Candidature envoyée',
      message: `Votre candidature pour ${jobTitle} chez ${companyName} a été envoyée avec succès.`,
      link: `/candidate-dashboard?tab=applications&application=${app.id}`,
      read: false
    });

    notifications.push({
      user_id: candidate.id,
      type: 'info',
      title: 'Candidature vue par le recruteur',
      message: `Bonne nouvelle ! Votre candidature pour ${jobTitle} a été consultée par le recruteur.`,
      link: `/candidate-dashboard?tab=applications&application=${app.id}`,
      read: false
    });

    notifications.push({
      user_id: candidate.id,
      type: 'warning',
      title: 'Action requise',
      message: `Le recruteur de ${companyName} souhaite obtenir plus d'informations sur votre expérience. Consultez votre messagerie.`,
      link: `/candidate-dashboard?tab=messages&application=${app.id}`,
      read: false
    });
  }

  // Insérer les notifications
  console.log(`📝 Création de ${notifications.length} notifications...`);

  const { data: inserted, error: insertError } = await supabase
    .from('notifications')
    .insert(notifications)
    .select();

  if (insertError) {
    console.error('❌ Erreur lors de la création des notifications:', insertError);
    return;
  }

  console.log(`✅ ${inserted.length} notifications créées avec succès !`);
  console.log('\n📊 Résumé:');
  inserted.forEach((notif, index) => {
    console.log(`  ${index + 1}. ${notif.title}`);
  });

  // Créer aussi une communication de test si une application existe
  if (applications && applications.length > 0) {
    const app = applications[0];

    // Trouver le recruteur qui a posté l'offre
    const { data: job } = await supabase
      .from('jobs')
      .select('recruiter_id')
      .eq('id', app.job_id)
      .single();

    if (job && job.recruiter_id) {
      console.log('\n📧 Création d\'une communication de test...');

      const { error: commError } = await supabase
        .from('communications_log')
        .insert({
          application_id: app.id,
          sender_id: job.recruiter_id,
          recipient_id: candidate.id,
          communication_type: 'recruiter_message',
          channel: 'email',
          subject: 'Demande d\'informations complémentaires',
          message: `Bonjour ${candidate.full_name},\n\nNous avons bien reçu votre candidature et celle-ci a retenu notre attention.\n\nNous aimerions en savoir plus sur votre expérience en développement full stack. Pourriez-vous nous en dire plus sur vos projets récents ?\n\nCordialement,\nL'équipe recrutement`,
          status: 'sent'
        });

      if (commError) {
        console.error('❌ Erreur lors de la création de la communication:', commError);
      } else {
        console.log('✅ Communication créée avec succès !');
      }
    }
  }

  console.log('\n✅ Configuration terminée !');
  console.log('🎯 Connectez-vous avec le compte:', candidate.email);
  console.log('📬 Allez dans l\'onglet Messages pour voir les conversations');
}

createTestNotifications()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur:', error);
    process.exit(1);
  });
