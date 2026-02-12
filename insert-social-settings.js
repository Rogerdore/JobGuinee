
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const [key, ...values] = line.split('=');
      if (key && values.length) {
        env[key.trim()] = values.join('=').trim();
      }
    });
    return env;
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertSocialSettings() {
  const settings = [
    { key: 'social_facebook', value: 'https://facebook.com/jobguinee', label: 'Facebook URL', description: 'URL de la page Facebook', category: 'social', type: 'url', is_public: true },
    { key: 'social_linkedin', value: 'https://linkedin.com/company/jobguinee', label: 'LinkedIn URL', description: 'URL de la page LinkedIn', category: 'social', type: 'url', is_public: true },
    { key: 'social_twitter', value: 'https://twitter.com/jobguinee', label: 'Twitter URL', description: 'URL du compte Twitter', category: 'social', type: 'url', is_public: true },
    { key: 'social_instagram', value: 'https://instagram.com/jobguinee', label: 'Instagram URL', description: 'URL du compte Instagram', category: 'social', type: 'url', is_public: true },
    { key: 'social_whatsapp', value: 'https://wa.me/224621000000', label: 'WhatsApp', description: 'Lien WhatsApp (format wa.me)', category: 'social', type: 'url', is_public: true }
  ];

  console.log('Inserting/Updating social settings...');

  for (const setting of settings) {
    const { error } = await supabase
      .from('site_settings')
      .upsert(setting, { onConflict: 'key' });

    if (error) {
      console.error(`Error inserting ${setting.key}:`, error.message);
    } else {
      console.log(`Successfully inserted/updated ${setting.key}`);
    }
  }
}

insertSocialSettings();
