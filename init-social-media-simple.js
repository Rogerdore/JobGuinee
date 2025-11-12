import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Lire le fichier .env
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initSocialMedia() {
  console.log('🔍 Vérification de la configuration des réseaux sociaux...\n');

  const { data: existing, error: checkError } = await supabase
    .from('social_media_configuration')
    .select('*')
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('❌ Erreur:', checkError.message);
    return;
  }

  if (existing) {
    console.log('✅ Configuration trouvée!\n');
    console.log('📊 État actuel:');
    console.log('  Facebook:', existing.enable_facebook ? '✓ Activé' : '✗ Désactivé', '-', existing.facebook_url);
    console.log('  Instagram:', existing.enable_instagram ? '✓ Activé' : '✗ Désactivé', '-', existing.instagram_url);
    console.log('  TikTok:', existing.enable_tiktok ? '✓ Activé' : '✗ Désactivé', '-', existing.tiktok_url);
    console.log('  YouTube:', existing.enable_youtube ? '✓ Activé' : '✗ Désactivé', '-', existing.youtube_url);
    console.log('  LinkedIn:', existing.enable_linkedin ? '✓ Activé' : '✗ Désactivé', '-', existing.linkedin_url);
    console.log('  Twitter:', existing.enable_twitter ? '✓ Activé' : '✗ Désactivé', '-', existing.twitter_url);
    console.log('\n💡 Les réseaux activés apparaissent dans le menu.');
    return;
  }

  console.log('⚠️  Aucune configuration trouvée. Création avec réseaux activés...\n');

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
      enable_tiktok: true,
      enable_youtube: true,
      enable_linkedin: true,
      enable_twitter: true,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Erreur:', error.message);
    return;
  }

  console.log('✅ Configuration créée avec succès!\n');
  console.log('📱 Tous les réseaux sociaux ont été activés:');
  console.log('  ✓ Facebook');
  console.log('  ✓ Instagram');
  console.log('  ✓ TikTok');
  console.log('  ✓ YouTube');
  console.log('  ✓ LinkedIn');
  console.log('  ✓ Twitter');
  console.log('\n🎉 Les icônes apparaissent maintenant dans le menu!');
  console.log('🔧 Vous pouvez les gérer depuis l\'admin: Réseaux Sociaux');
}

initSocialMedia().catch(console.error);
