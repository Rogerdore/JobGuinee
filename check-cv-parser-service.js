import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCVParserService() {
  console.log('🔍 Vérification du service ai_cv_parser...\n');

  const { data: service, error } = await supabase
    .from('service_credit_costs')
    .select('*')
    .eq('service_code', 'ai_cv_parser')
    .single();

  if (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n⚠️  Le service ai_cv_parser n\'existe pas encore.');
    console.log('\n📝 Création du service...');

    const insertData = {
      service_code: 'ai_cv_parser',
      service_name: 'Analyse de CV par IA',
      service_description: 'Analyse automatique de CV pour extraction automatique des informations (identité, expériences, formations, compétences)',
      credits_cost: 10,
      is_active: true,
      category: 'cv_services',
      icon: 'FileText',
      display_order: 5
    };

    const result = await supabase
      .from('service_credit_costs')
      .insert(insertData)
      .select()
      .single();

    if (result.error) {
      console.error('❌ Erreur lors de la création:', result.error.message);
      return;
    }

    console.log('✅ Service créé avec succès!');
    console.log(JSON.stringify(result.data, null, 2));
  } else {
    console.log('✅ Service trouvé:');
    console.log('   - Code:', service.service_code);
    console.log('   - Nom:', service.service_name);
    console.log('   - Coût:', service.credits_cost, 'crédits');
    console.log('   - Actif:', service.is_active ? 'Oui' : 'Non');
    console.log('   - Catégorie:', service.category);

    if (service.credits_cost !== 10) {
      console.log('\n⚠️  Le coût devrait être 10 crédits. Mise à jour...');

      const updateResult = await supabase
        .from('service_credit_costs')
        .update({ credits_cost: 10 })
        .eq('service_code', 'ai_cv_parser');

      if (updateResult.error) {
        console.error('❌ Erreur lors de la mise à jour:', updateResult.error.message);
      } else {
        console.log('✅ Coût mis à jour à 10 crédits');
      }
    }
  }
}

checkCVParserService().catch(console.error);
