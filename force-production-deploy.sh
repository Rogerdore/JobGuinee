#!/bin/bash

# Force Production Deployment Script
# This script forces a complete cache-busting deployment

set -e

echo "🚨 FORCE PRODUCTION DEPLOYMENT"
echo "========================================"
echo ""
echo "⚠️  WARNING: This will force-deploy the CURRENT dist/ folder"
echo "⚠️  This script assumes dist/ is already built and verified"
echo ""

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist/ folder not found"
    echo "The build must already exist. Do not rebuild."
    exit 1
fi

if [ ! -f "dist/index.html" ]; then
    echo "❌ Error: dist/index.html not found"
    exit 1
fi

echo "✅ Found dist/ folder with $(find dist -type f | wc -l) files"
echo ""

# Verify Supabase URL in bundle
echo "🔍 Verifying Supabase URL in production bundle..."
BUNDLE_URL=$(grep -r "hhhjzgeidjgctuveopso.supabase.co" dist/assets/*.js | head -1 || echo "")

if [ -z "$BUNDLE_URL" ]; then
    echo "❌ ERROR: Correct Supabase URL NOT found in bundle!"
    echo "The bundle may be corrupted or using wrong URL"
    exit 1
fi

echo "✅ Verified: Bundle contains CORRECT Supabase URL"
echo ""

# Add cache-busting timestamp to index.html
TIMESTAMP=$(date +%s)
echo "🔧 Adding cache-busting timestamp: $TIMESTAMP"

# Create a cache-busting marker file
echo "$TIMESTAMP" > dist/version.txt
echo "<!-- Deployed: $(date -u +%Y-%m-%dT%H:%M:%SZ) -->" >> dist/index.html

echo "✅ Cache-busting markers added"
echo ""

# Create fresh production ZIP with timestamp
ZIP_NAME="jobguinee-production-force-deploy-$TIMESTAMP.zip"
echo "📦 Creating fresh production package: $ZIP_NAME"

cd dist
zip -r "../$ZIP_NAME" . -q
cd ..

if [ ! -f "$ZIP_NAME" ]; then
    echo "❌ Failed to create ZIP package"
    exit 1
fi

ZIP_SIZE=$(ls -lh "$ZIP_NAME" | awk '{print $5}')
echo "✅ Created: $ZIP_NAME ($ZIP_SIZE)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT PACKAGE READY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 Package: $ZIP_NAME"
echo "📊 Size: $ZIP_SIZE"
echo "🕐 Timestamp: $TIMESTAMP"
echo "✅ Supabase URL: VERIFIED CORRECT"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYMENT INSTRUCTIONS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 1: BACKUP CURRENT PRODUCTION (CRITICAL)"
echo "  1. Login to Hostinger cPanel"
echo "  2. Open File Manager → public_html/"
echo "  3. Select ALL files"
echo "  4. Click 'Compress'"
echo "  5. Name: backup-before-force-deploy-$TIMESTAMP.zip"
echo "  6. Download to safe location"
echo ""
echo "STEP 2: CLEAR PRODUCTION (IMPORTANT)"
echo "  1. In public_html/, select ALL files and folders"
echo "  2. Click 'Delete'"
echo "  3. Confirm deletion"
echo "  4. Verify public_html/ is COMPLETELY EMPTY"
echo ""
echo "STEP 3: UPLOAD NEW BUILD"
echo "  1. Click 'Upload' in File Manager"
echo "  2. Select: $ZIP_NAME"
echo "  3. Wait for 100% upload completion"
echo ""
echo "STEP 4: EXTRACT FILES"
echo "  1. Right-click $ZIP_NAME"
echo "  2. Select 'Extract'"
echo "  3. Extract to current directory (public_html/)"
echo "  4. Wait for extraction to complete"
echo "  5. Delete the ZIP file after extraction"
echo ""
echo "STEP 5: SET PERMISSIONS"
echo "  1. Select ALL files in public_html/"
echo "  2. Right-click → 'Change Permissions'"
echo "  3. Files: 644 (rw-r--r--)"
echo "  4. Folders: 755 (rwxr-xr-x)"
echo "  5. Check 'Recurse into subdirectories'"
echo "  6. Apply"
echo ""
echo "STEP 6: FORCE CACHE CLEAR"
echo "  1. In Hostinger Dashboard, go to:"
echo "     Website → Advanced → Clear Cache"
echo "  2. If using Cloudflare:"
echo "     • Login to Cloudflare Dashboard"
echo "     • Go to Caching → Purge Everything"
echo "  3. If using LiteSpeed Cache:"
echo "     • cPanel → LiteSpeed Cache → Purge All"
echo ""
echo "STEP 7: VERIFY DEPLOYMENT"
echo "  1. Open incognito window"
echo "  2. Go to: https://jobguinee-pro.com"
echo "  3. Hard refresh: Ctrl+Shift+R"
echo "  4. Open DevTools (F12) → Console"
echo "  5. Check for errors"
echo "  6. Verify version: https://jobguinee-pro.com/version.txt"
echo "     Should show: $TIMESTAMP"
echo "  7. Test login/signup"
echo "  8. Verify WebSocket connects without errors"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚡ EMERGENCY ROLLBACK (If Needed)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "If deployment fails:"
echo "  1. Delete all files in public_html/"
echo "  2. Upload backup-before-force-deploy-$TIMESTAMP.zip"
echo "  3. Extract backup"
echo "  4. Restore previous state"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Package ready for deployment!"
echo "⚠️  Remember to CLEAR ALL CACHES after deployment"
echo ""
