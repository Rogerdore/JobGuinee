#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🤖 Test de configuration du Chatbot Alpha\n');
console.log('='.repeat(50));

let passedTests = 0;
let totalTests = 0;

function test(name, condition, successMsg, failMsg) {
  totalTests++;
  console.log(`\nTest ${totalTests}: ${name}`);
  if (condition) {
    console.log(`✅ ${successMsg}`);
    passedTests++;
    return true;
  } else {
    console.log(`❌ ${failMsg}`);
    return false;
  }
}

async function runTests() {
  // Test 1: Variables d'environnement
  test(
    'Variables d\'environnement',
    process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY,
    'Les variables d\'environnement sont définies',
    'Les variables VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY sont manquantes'
  );

  // Test 2: Fichiers du chatbot existent
  const chatbotFiles = [
    'src/components/chatbot/ChatbotWidget.tsx',
    'src/components/chatbot/AlphaAvatar.tsx',
    'src/components/chatbot/ChatbotWindow.tsx',
    'src/services/chatbotService.ts'
  ];

  let allFilesExist = true;
  chatbotFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.log(`   ❌ Fichier manquant: ${file}`);
      allFilesExist = false;
    }
  });

  test(
    'Fichiers du chatbot',
    allFilesExist,
    'Tous les fichiers du chatbot sont présents',
    'Certains fichiers du chatbot sont manquants'
  );

  // Test 3: ChatbotWidget importé dans Home.tsx
  const homeFilePath = path.join(__dirname, 'src/pages/Home.tsx');
  if (fs.existsSync(homeFilePath)) {
    const homeContent = fs.readFileSync(homeFilePath, 'utf-8');
    const hasImport = homeContent.includes('import ChatbotWidget');
    const hasComponent = homeContent.includes('<ChatbotWidget');

    test(
      'ChatbotWidget dans Home.tsx',
      hasImport && hasComponent,
      'ChatbotWidget est importé et utilisé dans Home.tsx',
      'ChatbotWidget n\'est pas correctement intégré dans Home.tsx'
    );
  }

  // Test 4: Animations CSS définies
  const cssFilePath = path.join(__dirname, 'src/index.css');
  if (fs.existsSync(cssFilePath)) {
    const cssContent = fs.readFileSync(cssFilePath, 'utf-8');
    const hasSlideUp = cssContent.includes('animate-slide-up');
    const hasScaleIn = cssContent.includes('animate-scale-in');
    const hasFadeIn = cssContent.includes('animate-fade-in');

    test(
      'Animations CSS',
      hasSlideUp && hasScaleIn && hasFadeIn,
      'Toutes les animations CSS sont définies',
      'Certaines animations CSS sont manquantes'
    );
  }

  // Test 5: Connexion à Supabase
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    try {
      const { data, error } = await supabase
        .from('chatbot_settings')
        .select('*')
        .limit(1)
        .single();

      test(
        'Connexion Supabase',
        !error && data,
        'Connexion réussie à Supabase',
        error ? `Erreur Supabase: ${error.message}` : 'Aucune donnée trouvée'
      );

      if (data) {
        // Test 6: Chatbot activé
        test(
          'Chatbot activé',
          data.is_enabled === true,
          'Le chatbot est activé (is_enabled = true)',
          'Le chatbot est désactivé (is_enabled = false)'
        );

        // Test 7: Configuration du style
        const { data: styleData, error: styleError } = await supabase
          .from('chatbot_styles')
          .select('*')
          .eq('is_default', true)
          .limit(1)
          .single();

        test(
          'Style par défaut',
          !styleError && styleData,
          'Style par défaut configuré',
          styleError ? `Erreur: ${styleError.message}` : 'Aucun style par défaut'
        );

        if (styleData) {
          console.log(`\n📊 Configuration actuelle:`);
          console.log(`   Position: ${data.position}`);
          console.log(`   Taille: ${styleData.widget_size}`);
          console.log(`   Animation: ${styleData.animation_type}`);
          console.log(`   Message de bienvenue: ${data.welcome_message.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.log(`❌ Erreur lors du test Supabase: ${error.message}`);
    }
  }

  // Résumé final
  console.log('\n' + '='.repeat(50));
  console.log(`\n📊 Résultat: ${passedTests}/${totalTests} tests réussis\n`);

  if (passedTests === totalTests) {
    console.log('🎉 Tous les tests sont passés! Le chatbot devrait être visible.\n');
    console.log('👉 Ouvrez http://localhost:5173 et vérifiez la page d\'accueil.');
    console.log('👉 Consultez CHATBOT_VERIFICATION_GUIDE.md pour plus de détails.\n');
  } else {
    console.log('⚠️  Certains tests ont échoué. Consultez les erreurs ci-dessus.\n');
    console.log('👉 Consultez CHATBOT_VERIFICATION_GUIDE.md pour le dépannage.\n');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

runTests().catch(console.error);
