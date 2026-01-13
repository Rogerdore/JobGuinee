import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkAdminSession() {
  console.log('🔐 Vérification de session admin\n');

  // Demander email et mot de passe
  const email = await question('Email admin: ');
  const password = await question('Mot de passe: ');

  console.log('\n🔄 Connexion...');

  // Se connecter
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password.trim()
  });

  if (authError) {
    console.error('\n❌ Erreur de connexion:', authError.message);
    rl.close();
    return;
  }

  console.log('\n✅ Connexion réussie!');
  console.log('   User ID:', authData.user.id);
  console.log('   Email:', authData.user.email);

  // Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, user_type, full_name, credits_balance')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error('\n❌ Erreur récupération profil:', profileError);
    rl.close();
    return;
  }

  console.log('\n👤 Profil:');
  console.log('   Type:', profile?.user_type);
  console.log('   Nom:', profile?.full_name);
  console.log('   Crédits:', profile?.credits_balance || 0);

  if (profile?.user_type !== 'admin') {
    console.error('\n❌ ERREUR: Ce compte n\'est PAS un admin!');
    console.log('   Type actuel:', profile?.user_type);
    rl.close();
    return;
  }

  console.log('\n✅ Compte admin confirmé!');

  // Récupérer un achat en attente
  console.log('\n📦 Recherche d\'achats à valider...');
  const { data: purchases, error: purchasesError } = await supabase
    .from('credit_purchases')
    .select('id, payment_reference, payment_status, total_credits, user_id')
    .eq('payment_status', 'waiting_proof')
    .limit(1);

  if (purchasesError) {
    console.error('\n❌ Erreur récupération achats:', purchasesError);
    rl.close();
    return;
  }

  if (!purchases || purchases.length === 0) {
    console.log('\nℹ️  Aucun achat en attente de validation');
    rl.close();
    return;
  }

  const purchase = purchases[0];
  console.log('\n✅ Achat trouvé:');
  console.log('   Référence:', purchase.payment_reference);
  console.log('   Crédits:', purchase.total_credits);
  console.log('   ID:', purchase.id);

  // Tester l'appel RPC
  console.log('\n🧪 Test de la fonction complete_credit_purchase...');

  const { data: result, error: rpcError } = await supabase.rpc('complete_credit_purchase', {
    p_purchase_id: purchase.id,
    p_admin_notes: 'Test depuis script de diagnostic'
  });

  if (rpcError) {
    console.error('\n❌ ERREUR RPC:', rpcError);
    console.log('\nDétails:');
    console.log('   Message:', rpcError.message);
    console.log('   Code:', rpcError.code);
    console.log('   Détails:', rpcError.details);
    console.log('   Hint:', rpcError.hint);
  } else {
    console.log('\n✅ Résultat:', JSON.stringify(result, null, 2));

    if (result && result.success) {
      console.log('\n🎉 VALIDATION RÉUSSIE!');
      console.log('   Crédits ajoutés:', result.credits_added);
      console.log('   Nouveau solde:', result.new_balance);
    } else {
      console.log('\n❌ Échec de validation');
      console.log('   Message:', result?.message);
      console.log('   Erreur:', result?.error);
    }
  }

  rl.close();
}

checkAdminSession().catch(err => {
  console.error('Erreur:', err);
  rl.close();
});
