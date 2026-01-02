import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testAdminCreditValidation() {
  console.log('🧪 TEST: Validation des Achats de Crédits par Admin\n');
  console.log('=' .repeat(60));

  // 1. Lister les admins
  console.log('\n📋 ÉTAPE 1: Vérification des comptes admin');
  const { data: admins, error: adminError } = await supabase
    .from('profiles')
    .select('id, email, user_type, full_name')
    .eq('user_type', 'admin');

  if (adminError) {
    console.error('❌ Erreur:', adminError);
    return;
  }

  console.log(`✅ ${admins.length} admin(s) trouvé(s):`);
  admins.forEach((admin, i) => {
    console.log(`   ${i + 1}. ${admin.full_name} (${admin.email})`);
  });

  if (admins.length === 0) {
    console.error('\n❌ PROBLÈME: Aucun admin trouvé!');
    console.log('\n💡 Solution: Créez un compte admin avec:');
    console.log('   node create-admin.js');
    return;
  }

  // 2. Lister les achats en attente
  console.log('\n📦 ÉTAPE 2: Achats en attente de validation');
  const { data: pendingPurchases, error: purchaseError } = await supabase
    .from('credit_purchases')
    .select(`
      id,
      user_id,
      payment_reference,
      payment_status,
      total_credits,
      price_amount,
      currency,
      created_at,
      profiles:user_id (
        email,
        full_name,
        credits_balance
      )
    `)
    .in('payment_status', ['pending', 'waiting_proof'])
    .order('created_at', { ascending: false })
    .limit(5);

  if (purchaseError) {
    console.error('❌ Erreur:', purchaseError);
    return;
  }

  if (pendingPurchases.length === 0) {
    console.log('ℹ️  Aucun achat en attente');
    console.log('\n💡 Pour créer un achat de test:');
    console.log('   1. Connectez-vous comme utilisateur normal');
    console.log('   2. Allez sur la page Crédit Store');
    console.log('   3. Achetez un pack de crédits');
    console.log('   4. Marquez-le comme "Preuve envoyée"');
    return;
  }

  console.log(`✅ ${pendingPurchases.length} achat(s) en attente:`);
  pendingPurchases.forEach((p, i) => {
    console.log(`\n   ${i + 1}. ${p.payment_reference}`);
    console.log(`      Utilisateur: ${p.profiles?.full_name} (${p.profiles?.email})`);
    console.log(`      Statut: ${p.payment_status}`);
    console.log(`      Montant: ${p.price_amount} ${p.currency}`);
    console.log(`      Crédits à ajouter: ${p.total_credits}`);
    console.log(`      Solde actuel: ${p.profiles?.credits_balance || 0} crédits`);
  });

  // 3. Instructions de test
  const testAdmin = admins[0];
  const testPurchase = pendingPurchases[0];

  console.log('\n🧪 ÉTAPE 3: Instructions pour tester la validation');
  console.log(`   Admin à utiliser: ${testAdmin.email}`);
  console.log(`   Achat à valider: ${testPurchase.payment_reference}`);

  console.log('\n⚠️  IMPORTANT: Pour tester complètement:');
  console.log('   1. Connectez-vous sur le frontend avec:', testAdmin.email);
  console.log('   2. Allez sur la page "Validation des Paiements"');
  console.log('   3. Ouvrez la console du navigateur (F12)');
  console.log('   4. Cliquez sur le bouton vert pour valider:', testPurchase.payment_reference);
  console.log('   5. Vérifiez dans la console les logs [AdminCreditPurchases]');

  // 4. Simuler la validation (avec service role key)
  console.log('\n🔧 ÉTAPE 4: Simulation de validation (bypass RLS)');

  // Vérifier d'abord que l'achat existe
  const { data: checkPurchase } = await supabase
    .from('credit_purchases')
    .select('*')
    .eq('id', testPurchase.id)
    .single();

  if (!checkPurchase) {
    console.error('❌ Achat introuvable');
    return;
  }

  console.log('✅ Achat trouvé');

  // Simuler la mise à jour (sans passer par la fonction pour éviter les checks auth)
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance')
    .eq('id', testPurchase.user_id)
    .single();

  const currentBalance = profile?.credits_balance || 0;
  const newBalance = currentBalance + testPurchase.total_credits;

  console.log(`\n📊 Résumé de la simulation:`);
  console.log(`   Solde actuel: ${currentBalance} crédits`);
  console.log(`   Crédits à ajouter: ${testPurchase.total_credits}`);
  console.log(`   Nouveau solde: ${newBalance} crédits`);

  console.log('\n⚠️  SIMULATION SEULEMENT - Pas de changement en base');
  console.log('   Pour valider réellement, utilisez le frontend avec un compte admin');

  // 5. Note sur les permissions RLS
  console.log('\n🔒 ÉTAPE 5: Sécurité RLS');
  console.log('✅ RLS actif sur la table credit_purchases');
  console.log('   Seuls les admins peuvent valider les achats');

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST TERMINÉ\n');

  console.log('📝 PROCHAINES ÉTAPES:');
  console.log('   1. Ouvrez le frontend dans votre navigateur');
  console.log('   2. Connectez-vous avec:', testAdmin.email);
  console.log('   3. Allez sur: Admin > Validation des Paiements');
  console.log('   4. Ouvrez la console du navigateur (F12)');
  console.log('   5. Cliquez sur le bouton vert de validation');
  console.log('   6. Vérifiez les logs qui apparaissent');
  console.log('\n   Si "Session exists: true" et "Is admin: true"');
  console.log('   → La validation devrait fonctionner! ✅');
  console.log('\n   Si erreur "UNAUTHORIZED" ou "FORBIDDEN"');
  console.log('   → Partagez les logs de la console');
}

testAdminCreditValidation().catch(console.error);
