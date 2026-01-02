import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugAdminCreditValidation() {
  console.log('🔍 Diagnostic de validation des achats de crédits\n');

  // 1. Vérifier l'utilisateur connecté
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error('❌ Aucun utilisateur connecté');
    console.log('\n💡 Solution : Connectez-vous d\'abord avec un compte admin');
    return;
  }

  console.log('✅ Utilisateur connecté:', user.email);
  console.log('   ID:', user.id);

  // 2. Vérifier le profil et le type d'utilisateur
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, user_type, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Erreur récupération profil:', profileError);
    return;
  }

  if (!profile) {
    console.error('❌ Profil introuvable pour cet utilisateur');
    return;
  }

  console.log('\n📋 Profil:');
  console.log('   Type:', profile.user_type);
  console.log('   Nom:', profile.full_name);

  if (profile.user_type !== 'admin') {
    console.error('\n❌ PROBLÈME IDENTIFIÉ:');
    console.error('   Votre compte n\'a PAS le type "admin"');
    console.error('   Type actuel:', profile.user_type);
    console.log('\n💡 Solution : Mettre à jour le type d\'utilisateur en "admin"');
    console.log('\n🔧 Commande SQL à exécuter:');
    console.log(`   UPDATE profiles SET user_type = 'admin' WHERE id = '${user.id}';`);
    console.log('\n   Ou utilisez le script: node update-to-admin.js');
    return;
  }

  console.log('✅ Type d\'utilisateur correct: admin');

  // 3. Vérifier les achats en attente
  const { data: purchases, error: purchasesError } = await supabase
    .from('credit_purchases')
    .select('*')
    .in('payment_status', ['pending', 'waiting_proof'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (purchasesError) {
    console.error('\n❌ Erreur récupération achats:', purchasesError);
    return;
  }

  console.log('\n📦 Achats en attente de validation:', purchases?.length || 0);

  if (purchases && purchases.length > 0) {
    purchases.forEach((p, i) => {
      console.log(`\n   ${i + 1}. Référence: ${p.payment_reference}`);
      console.log(`      Statut: ${p.payment_status}`);
      console.log(`      Crédits: ${p.total_credits}`);
      console.log(`      Montant: ${p.price_amount} ${p.currency}`);
    });

    // 4. Tester la fonction avec le premier achat
    console.log('\n🧪 Test de validation avec le premier achat...');
    const testPurchase = purchases[0];

    const { data: result, error: completeError } = await supabase.rpc(
      'complete_credit_purchase',
      {
        p_purchase_id: testPurchase.id,
        p_admin_notes: 'Test de validation automatique'
      }
    );

    if (completeError) {
      console.error('\n❌ ERREUR lors de la validation:', completeError);
      console.log('\nDétails de l\'erreur:');
      console.log('   Message:', completeError.message);
      console.log('   Code:', completeError.code);
      console.log('   Détails:', completeError.details);
      console.log('   Hint:', completeError.hint);
    } else if (result && !result.success) {
      console.error('\n❌ Validation échouée:', result.message);
      console.log('   Erreur:', result.error);
    } else {
      console.log('\n✅ Validation réussie!');
      console.log('   Crédits ajoutés:', result.credits_added);
      console.log('   Nouveau solde:', result.new_balance);
    }
  } else {
    console.log('   Aucun achat en attente de validation');
  }

  console.log('\n✅ Diagnostic terminé');
}

debugAdminCreditValidation().catch(console.error);
