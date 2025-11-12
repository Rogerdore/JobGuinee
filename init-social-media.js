import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initSocialMedia() {
  console.log('🔍 Vérification de la configuration des réseaux sociaux...');

  // Vérifier si la configuration existe
  const { data: existing, error: checkError } = await supabase
    .from('social_media_configuration')
    .select('*')
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Erreur lors de la vérification:', checkError);
    return;
  }

  if (existing) {
    console.log('✅ Configuration trouvée:', existing);
    console.log('');
    console.log('📊 État actuel:');
    console.log('  Facebook:', existing.enable_facebook ? '✓ Activé' : '✗ Désactivé');
    console.log('  Instagram:', existing.enable_instagram ? '✓ Activé' : '✗ Désactivé');
    console.log('  TikTok:', existing.enable_tiktok ? '✓ Activé' : '✗ Désactivé');
    console.log('  YouTube:', existing.enable_youtube ? '✓ Activé' : '✗ Désactivé');
    console.log('  LinkedIn:', existing.enable_linkedin ? '✓ Activé' : '✗ Désactivé');
    console.log('  Twitter:', existing.enable_twitter ? '✓ Activé' : '✗ Désactivé');
    console.log('');
    console.log('💡 Pour activer les réseaux sociaux:');
    console.log('   1. Connectez-vous en tant qu\'admin');
    console.log('   2. Allez dans "Réseaux Sociaux"');
    console.log('   3. Activez les réseaux souhaités');
    console.log('   4. Sauvegardez');
    return;
  }

  console.log('⚠️  Aucune configuration trouvée. Création...');

  // Créer la configuration par défaut avec quelques réseaux activés pour test
  const { data, error } = await supabase
    .from('social_media_configuration')
    .insert({
      facebook_url: 'https://facebook.com/jobguinee',
      instagram_url: 'https://instagram.com/jobguinee',
      tiktok_url: 'https://tiktok.com/@jobguinee',
      youtube_url: 'https://youtube.com/@jobguinee',
      linkedin_url: 'https://linkedin.com/company/jobguinee',
      twitter_url: 'https://twitter.com/jobguinee',
      enable_facebook: true,
      enable_instagram: true,
      enable_tiktok: false,
      enable_youtube: true,
      enable_linkedin: true,
      enable_twitter: false,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur lors de la création:', error);
    return;
  }

  console.log('✅ Configuration créée avec succès!');
  console.log('');
  console.log('📱 Réseaux sociaux activés:');
  console.log('  ✓ Facebook');
  console.log('  ✓ Instagram');
  console.log('  ✓ YouTube');
  console.log('  ✓ LinkedIn');
  console.log('');
  console.log('🎉 Les icônes apparaîtront maintenant dans le menu!');
}

initSocialMedia().catch(console.error);
