#!/bin/bash

# Verify Bolt Deployment Status
echo "🔍 Bolt Production Deployment Verification"
echo "=========================================="
echo ""

# Check local build
echo "📦 Local Build Status:"
if [ -d "dist" ]; then
    echo "✅ dist/ folder exists"
    echo "   Files: $(find dist -type f | wc -l)"
    echo "   Size: $(du -sh dist | cut -f1)"

    # Check Supabase URL in bundle
    CORRECT_URL=$(grep -r "hhhjzgeidjgctuveopso" dist/assets/*.js 2>/dev/null | head -1)
    WRONG_URL=$(grep -r "hhhjzgeidjqctuveopso" dist/assets/*.js 2>/dev/null | head -1)

    if [ -n "$CORRECT_URL" ]; then
        echo "   ✅ Correct Supabase URL found (with 'g')"
    else
        echo "   ❌ Correct Supabase URL NOT found"
    fi

    if [ -n "$WRONG_URL" ]; then
        echo "   ⚠️  WARNING: Wrong Supabase URL found (with 'q')"
    fi
else
    echo "❌ dist/ folder NOT found"
fi

echo ""
echo "🌐 Live Site Check:"
echo "   Testing: https://jobguinee-pro.com"
echo ""

# Check if site is accessible
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://jobguinee-pro.com" 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Site is accessible (HTTP $HTTP_CODE)"
else
    echo "❌ Site returned HTTP $HTTP_CODE"
fi

# Try to fetch index.html and check for deployment markers
echo ""
echo "📄 Checking site content..."

INDEX_CONTENT=$(curl -s --max-time 10 "https://jobguinee-pro.com" 2>/dev/null || echo "")

if [ -n "$INDEX_CONTENT" ]; then
    # Check which Supabase URL is being used
    if echo "$INDEX_CONTENT" | grep -q "hhhjzgeidjgctuveopso"; then
        echo "✅ Site is using CORRECT Supabase URL (with 'g')"
    elif echo "$INDEX_CONTENT" | grep -q "hhhjzgeidjqctuveopso"; then
        echo "❌ Site is using WRONG Supabase URL (with 'q')"
        echo "   🚨 Production is still serving OLD BUILD"
    else
        echo "⚠️  Could not detect Supabase URL in content"
    fi

    # Check build timestamp
    if echo "$INDEX_CONTENT" | grep -q "2026-01-11"; then
        echo "✅ Site shows recent build date (2026-01-11)"
    else
        echo "⚠️  Site may be showing older build"
    fi
else
    echo "❌ Could not fetch site content"
fi

echo ""
echo "🔧 Deployment Actions Needed:"
echo "=========================================="
echo ""

if [ "$HTTP_CODE" != "200" ] || echo "$INDEX_CONTENT" | grep -q "hhhjzgeidjqctuveopso"; then
    echo "🚨 DEPLOYMENT REQUIRED"
    echo ""
    echo "The site is either down or serving the old broken build."
    echo ""
    echo "You need to deploy through Bolt's interface:"
    echo ""
    echo "Option 1: Bolt Web Interface"
    echo "  1. Go to your Bolt project dashboard"
    echo "  2. Look for 'Deploy' or 'Publish' button"
    echo "  3. Click it to trigger deployment"
    echo "  4. Wait for deployment to complete"
    echo "  5. Clear CDN cache if option available"
    echo ""
    echo "Option 2: Bolt May Auto-Deploy"
    echo "  - Bolt detected the new build we just created"
    echo "  - It may auto-deploy in a few minutes"
    echo "  - Wait 5-10 minutes and check again"
    echo ""
    echo "Option 3: Force Rebuild in Bolt"
    echo "  - In Bolt dashboard, trigger a rebuild"
    echo "  - This will pick up the latest changes"
    echo "  - Bolt will deploy automatically after build"
    echo ""
    echo "After deployment, run this script again to verify."
else
    echo "✅ DEPLOYMENT SUCCESSFUL"
    echo ""
    echo "The site is live and serving the correct build!"
    echo ""
    echo "Final verification steps:"
    echo "  1. Open incognito window: https://jobguinee-pro.com"
    echo "  2. Press F12 → Console tab"
    echo "  3. Verify no Supabase connection errors"
    echo "  4. Test login/signup functionality"
    echo "  5. Check WebSocket connections work"
fi

echo ""
echo "=========================================="
