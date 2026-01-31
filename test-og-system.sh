#!/bin/bash

echo "========================================="
echo "   TEST SYSTÈME OPEN GRAPH - JobGuinée"
echo "========================================="
echo ""

# Test 1: Edge Function
echo "1️⃣  Test Edge Function Supabase..."
EDGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway/test-123 2>/dev/null)
if [ "$EDGE_RESPONSE" = "200" ] || [ "$EDGE_RESPONSE" = "404" ]; then
  echo "   ✅ Edge Function accessible (HTTP $EDGE_RESPONSE)"
else
  echo "   ❌ Edge Function erreur: HTTP $EDGE_RESPONSE"
fi

# Test 2: Image par défaut locale
echo ""
echo "2️⃣  Test image OG par défaut..."
if [ -f "public/assets/share/default-job.png" ]; then
  SIZE=$(ls -lh public/assets/share/default-job.png | awk '{print $5}')
  echo "   ✅ Image existe localement ($SIZE)"
else
  echo "   ❌ Image manquante"
  echo "      → Ouvrir generate-og-default-image.html dans navigateur"
  echo "      → Générer et télécharger l'image"
  echo "      → Placer dans public/assets/share/default-job.png"
fi

# Test 3: .htaccess
echo ""
echo "3️⃣  Test fichier .htaccess..."
if [ -f "public/.htaccess" ]; then
  echo "   ✅ .htaccess existe"
  if grep -q "social-gateway" "public/.htaccess"; then
    echo "   ✅ Configuration OG présente"
  else
    echo "   ❌ Configuration OG manquante dans .htaccess"
  fi
else
  echo "   ❌ .htaccess manquant"
fi

# Test 4: Build
echo ""
echo "4️⃣  Test build production..."
if [ -d "dist" ]; then
  BUILD_SIZE=$(du -sh dist 2>/dev/null | awk '{print $1}')
  echo "   ✅ Build existe ($BUILD_SIZE)"
else
  echo "   ⚠️  Aucun build trouvé"
  echo "      → Exécuter: npm run build"
fi

# Test 5: Générateur HTML
echo ""
echo "5️⃣  Test générateur d'image..."
if [ -f "generate-og-default-image.html" ]; then
  echo "   ✅ Générateur HTML présent"
  echo "      → Ouvrir dans navigateur pour générer l'image"
else
  echo "   ❌ Générateur manquant"
fi

# Test 6: Edge Function contenu
echo ""
echo "6️⃣  Test contenu Edge Function..."
EDGE_CONTENT=$(curl -s -A "facebookexternalhit/1.1" https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway/test-123 2>/dev/null | head -20)
if echo "$EDGE_CONTENT" | grep -q "og:title"; then
  echo "   ✅ Edge Function retourne HTML avec balises OG"
else
  echo "   ⚠️  Edge Function ne retourne pas de balises OG visibles"
fi

echo ""
echo "========================================="
echo "           RÉSUMÉ DES ACTIONS"
echo "========================================="
echo ""
echo "✅ Actions réussies"
echo "❌ Actions requises"
echo "⚠️  Avertissements"
echo ""
echo "PROCHAINES ÉTAPES:"
echo "1. Si image manquante: Ouvrir generate-og-default-image.html"
echo "2. Exécuter: npm run build"
echo "3. Déployer sur Hostinger via FTP"
echo "4. Tester avec Facebook Debugger"
echo ""
