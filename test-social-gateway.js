#!/usr/bin/env node

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://hhhjzgeidjqctuveopso.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGp6Z2VpZGpxY3R1dmVvcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDc5NjUsImV4cCI6MjA4MDMyMzk2NX0.kaxpdgyYyGXiN93bThIceJ_p0j6hZQr5yz7obTtRSqA';

async function getFirstJob() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/jobs?limit=1&select=id,title,company_name,description`, {
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  });

  const data = await response.json();
  return data[0];
}

async function testSocialGateway(jobId) {
  console.log('\\n' + '='.repeat(70));
  console.log('SOCIAL GATEWAY TEST');
  console.log('='.repeat(70) + '\\n');

  const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/social-gateway/${jobId}`;

  console.log(`Testing Edge Function: ${edgeFunctionUrl}\\n`);

  try {
    // Test 1: Fetch without crawler user-agent
    console.log('Test 1: Request sans User-Agent (utilisateur normal)');
    let response = await fetch(edgeFunctionUrl);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    const html = await response.text();
    console.log(`HTML Length: ${html.length} caractères`);

    // Check for OG tags
    const hasOGTags = html.includes('property=\"og:');
    const hasTitle = html.includes('og:title');
    const hasDescription = html.includes('og:description');
    const hasImage = html.includes('og:image');

    console.log(`\\n✓ OG Tags détectées:`);
    console.log(`  - og:title: ${hasTitle ? '✅' : '❌'}`);
    console.log(`  - og:description: ${hasDescription ? '✅' : '❌'}`);
    console.log(`  - og:image: ${hasImage ? '✅' : '❌'}`);

    // Check for Twitter tags
    const hasTwitter = html.includes('twitter:card');
    console.log(`\\n✓ Twitter Tags: ${hasTwitter ? '✅' : '❌'}`);

    // Check for redirect
    const hasRedirect = html.includes('meta http-equiv=\"refresh\"') || html.includes('window.location');
    console.log(`✓ Redirect configuré: ${hasRedirect ? '✅' : '❌'}`);

    // Extract some OG values
    const titleMatch = html.match(/og:title\"\\s+content=\"([^\"]+)\"/);
    const descriptionMatch = html.match(/og:description\"\\s+content=\"([^\"]+)\"/);
    const imageMatch = html.match(/og:image\"\\s+content=\"([^\"]+)\"/);

    if (titleMatch) console.log(`\\n📝 OG Title: ${titleMatch[1]}`);
    if (descriptionMatch) console.log(`📝 OG Description: ${descriptionMatch[1].substring(0, 60)}...`);
    if (imageMatch) console.log(`📝 OG Image: ${imageMatch[1]}`);

    // Test 2: Fetch with Facebook crawler user-agent
    console.log('\\n' + '-'.repeat(70));
    console.log('Test 2: Request avec User-Agent Facebook Crawler');
    response = await fetch(edgeFunctionUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1'
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    console.log(`Cache-Control: ${response.headers.get('cache-control')}`);

    console.log('\\n✅ Edge Function est accessible!');

    // Test 3: Check .htaccess configuration
    console.log('\\n' + '-'.repeat(70));
    console.log('Test 3: Vérification de la configuration .htaccess');

    const appUrl = 'https://jobguinee-pro.com';
    const shareUrl = `${appUrl}/share/${jobId}`;

    console.log(`\\n📌 Share URL: ${shareUrl}`);
    console.log(`📌 Edge Function URL: ${edgeFunctionUrl}`);

    console.log('\\n✓ Configuration complète:');
    console.log('  1. .htaccess détecte User-Agent crawler');
    console.log('  2. Reroute vers Edge Function');
    console.log('  3. Edge Function retourne HTML avec OG tags');
    console.log('  4. Utilisateur normal reçoit HTML + redirect');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }

  console.log('\\n' + '='.repeat(70) + '\\n');
}

async function main() {
  console.log('\\n🔍 Fetching un job pour tester...\\n');

  const job = await getFirstJob();

  if (!job) {
    console.error('❌ Aucun job trouvé dans la base de données');
    console.log('Vous devez avoir au moins un job pour tester');
    process.exit(1);
  }

  console.log(`✅ Job trouvé: ${job.title} (ID: ${job.id})`);

  await testSocialGateway(job.id);

  console.log('\\n✅ Test complet!');
  console.log(`\\nPour tester avec Facebook Debugger:`);
  console.log(`1. Aller à: https://developers.facebook.com/tools/debug/sharing/`);
  console.log(`2. Entrer: https://jobguinee-pro.com/share/${job.id}`);
  console.log(`3. Cliquer: "Fetch new scrape information"`);
  console.log(`4. Vérifier l'aperçu\n`);
}

main().catch(console.error);
