#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

console.log('\n🔍 Vérification Configuration Supabase\n');
console.log('═'.repeat(70));

const errors = [];
const warnings = [];

// 1. Vérifier les fichiers .env
console.log('\n📁 Vérification des fichiers .env...\n');

try {
  const envContent = readFileSync('.env', 'utf-8');
  const envProdContent = readFileSync('.env.production', 'utf-8');

  const extractUrl = (content) => {
    const match = content.match(/VITE_SUPABASE_URL=(.*)/);
    return match ? match[1].trim() : null;
  };

  const envUrl = extractUrl(envContent);
  const envProdUrl = extractUrl(envProdContent);

  console.log(`   .env:             ${envUrl}`);
  console.log(`   .env.production:  ${envProdUrl}`);

  if (envUrl !== envProdUrl) {
    warnings.push('URLs différentes entre .env et .env.production');
    console.log('\n   ⚠️  ATTENTION: URLs différentes !');
  } else {
    console.log('\n   ✅ URLs cohérentes');
  }
} catch (err) {
  errors.push('Impossible de lire les fichiers .env');
  console.log('\n   ❌ Erreur:', err.message);
}

// 2. Vérifier les variables d'environnement chargées
console.log('\n' + '═'.repeat(70));
console.log('\n📋 Variables d\'environnement chargées...\n');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const environment = process.env.VITE_ENVIRONMENT || 'development';

if (!supabaseUrl) {
  errors.push('VITE_SUPABASE_URL non définie');
  console.log('   ❌ VITE_SUPABASE_URL: MANQUANTE');
} else {
  console.log(`   ✅ VITE_SUPABASE_URL: ${supabaseUrl}`);
}

if (!supabaseAnonKey) {
  errors.push('VITE_SUPABASE_ANON_KEY non définie');
  console.log('   ❌ VITE_SUPABASE_ANON_KEY: MANQUANTE');
} else {
  console.log(`   ✅ VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 30)}...`);
}

console.log(`   ℹ️  VITE_ENVIRONMENT: ${environment}`);

if (errors.length > 0) {
  console.log('\n' + '═'.repeat(70));
  console.log('\n❌ ERREURS CRITIQUES\n');
  errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  console.log('\n   Impossible de continuer sans les variables d\'environnement.');
  console.log('\n═'.repeat(70));
  process.exit(1);
}

// 3. Tester la connexion Supabase
console.log('\n' + '═'.repeat(70));
console.log('\n🌐 Test de connexion Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

let connectionSuccess = false;

try {
  // Test 1: Vérifier l'URL
  console.log('   Test 1: Vérification de l\'URL...');
  const urlObj = new URL(supabaseUrl);
  console.log(`           Protocol: ${urlObj.protocol}`);
  console.log(`           Host: ${urlObj.hostname}`);
  console.log('           ✅ URL valide');

  // Test 2: Auth service
  console.log('\n   Test 2: Service d\'authentification...');
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  console.log('           ✅ Auth service accessible');

  // Test 3: Database
  console.log('\n   Test 3: Accès base de données...');
  const { data: healthCheck, error: dbError } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);

  if (dbError && dbError.code !== 'PGRST116') {
    console.log(`           ⚠️  Warning: ${dbError.message}`);
    warnings.push('Accès base de données limité (RLS)');
  } else {
    console.log('           ✅ Database accessible');
  }

  connectionSuccess = true;

} catch (err) {
  errors.push(`Connexion Supabase échouée: ${err.message}`);
  console.log(`\n   ❌ Erreur: ${err.message}`);

  if (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND')) {
    console.log('\n   💡 Causes possibles:');
    console.log('      1. Pas de connexion internet');
    console.log('      2. URL Supabase incorrecte');
    console.log('      3. Supabase temporairement indisponible');
    console.log('      4. Firewall bloquant la connexion');
  }
}

// 4. Résumé
console.log('\n' + '═'.repeat(70));
console.log('\n📊 RÉSUMÉ\n');

if (connectionSuccess) {
  console.log('   ✅ Configuration Supabase: VALIDE');
  console.log('   ✅ Connexion: ÉTABLIE');
  console.log('   ✅ Services: OPÉRATIONNELS');
} else {
  console.log('   ❌ Configuration Supabase: PROBLÈME DÉTECTÉ');
  console.log('   ❌ Connexion: ÉCHEC');
}

if (warnings.length > 0) {
  console.log('\n   ⚠️  Avertissements:');
  warnings.forEach((warn, i) => console.log(`      ${i + 1}. ${warn}`));
}

if (errors.length > 0) {
  console.log('\n   ❌ Erreurs:');
  errors.forEach((err, i) => console.log(`      ${i + 1}. ${err}`));
}

console.log('\n' + '═'.repeat(70));

if (errors.length > 0) {
  console.log('\n❌ ÉCHEC - Configuration invalide\n');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('\n⚠️  ATTENTION - Configuration valide mais avec avertissements\n');
  process.exit(0);
} else {
  console.log('\n✅ SUCCÈS - Configuration parfaite\n');
  process.exit(0);
}
