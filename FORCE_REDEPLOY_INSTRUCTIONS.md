# 🚨 FORCE PRODUCTION REDEPLOYMENT

**Status:** CRITICAL - Production is serving OLD broken frontend
**Issue:** Production using wrong Supabase URL (with 'q' typo)
**Solution:** Force redeploy with cache invalidation

---

## 🎯 What's Wrong

### Current State
- ❌ Production: `https://hhhjzgeidjqctuveopso.supabase.co` (WRONG - has 'q')
- ✅ Build: `https://hhhjzgeidjgctuveopso.supabase.co` (CORRECT - has 'g')
- ❌ Result: WebSocket failures, Auth errors, ERR_NAME_NOT_RESOLVED

### Root Cause
Production is serving **cached old files** with the wrong Supabase URL

---

## 📦 Deployment Package Ready

**File:** `jobguinee-production-force-deploy-1768097505.zip`
**Size:** 1.5M
**Timestamp:** 1768097505
**Cache-busting:** ✅ Enabled (version.txt included)
**Supabase URL:** ✅ VERIFIED CORRECT

---

## 🚀 COMPLETE REDEPLOYMENT PROCEDURE

### Phase 1: Clear Bolt CDN Cache (If Using Bolt)

If your site is deployed through Bolt.new, you need to:

1. **Via Bolt Dashboard:**
   - Go to your Bolt project dashboard
   - Click on the deployment/production tab
   - Look for "Clear Cache" or "Invalidate Cache" button
   - Click it and wait for confirmation

2. **Via Bolt CLI (if available):**
   ```bash
   bolt cache clear --production
   bolt deploy --force-refresh
   ```

3. **If you can't find cache controls:**
   - Contact Bolt support
   - OR proceed with manual Hostinger deployment

---

### Phase 2: Force Hostinger Redeployment

#### Step 1: BACKUP (CRITICAL - DON'T SKIP)

**Why:** In case something goes wrong, you can restore

1. Login to **Hostinger cPanel**
2. Open **File Manager**
3. Navigate to `public_html/`
4. Select **ALL files and folders** (Ctrl+A or Cmd+A)
5. Click **"Compress"** button
6. Name it: `backup-before-force-deploy-1768097505.zip`
7. **Download to your computer** (right-click → Download)
8. Verify the backup ZIP downloaded successfully

**CHECKPOINT:** Backup safely stored on your computer? ✅

---

#### Step 2: DELETE ALL PRODUCTION FILES

**Why:** Complete clean slate ensures no old cached files remain

1. Still in `public_html/`
2. Select **ALL files and folders**
3. Click **"Delete"** button
4. Confirm deletion
5. **Verify `public_html/` is COMPLETELY EMPTY**
   - Refresh the file manager
   - Should show "No files"
   - If any hidden files remain (like .htaccess), delete those too

**CHECKPOINT:** public_html/ is 100% empty? ✅

---

#### Step 3: UPLOAD NEW BUILD

1. In File Manager, make sure you're in `public_html/`
2. Click **"Upload"** button
3. Select: `jobguinee-production-force-deploy-1768097505.zip`
   - Download it from this project first if needed
4. **Wait for 100% upload completion**
   - Don't close the browser
   - Watch the progress bar
5. Verify the ZIP appears in `public_html/`

**CHECKPOINT:** ZIP uploaded successfully? ✅

---

#### Step 4: EXTRACT FILES

1. Right-click on `jobguinee-production-force-deploy-1768097505.zip`
2. Select **"Extract"**
3. Extract to: **Current directory** (`public_html/`)
4. **Wait for extraction to complete**
   - This may take 30-60 seconds
5. After extraction, verify you see:
   - `index.html`
   - `assets/` folder
   - `version.txt`
   - `.htaccess`
   - Other files and folders
6. **Delete the ZIP file** (right-click → Delete)

**CHECKPOINT:** All files extracted correctly? ✅

---

#### Step 5: SET CORRECT PERMISSIONS

**Why:** Incorrect permissions cause 403 errors and access issues

1. Still in `public_html/`
2. Select **ALL files and folders** (Ctrl+A)
3. Right-click → **"Change Permissions"**
4. Set:
   - **Files: 644** (rw-r--r--)
   - **Folders: 755** (rwxr-xr-x)
5. Check **"Recurse into subdirectories"**
6. Click **"Apply"**
7. Wait for all permissions to update

**CHECKPOINT:** Permissions set correctly? ✅

---

### Phase 3: Cache Invalidation

#### Step 1: Hostinger Cache

1. In **Hostinger Dashboard**, go to:
   - **Website** → **Advanced** → **Clear Cache**
   - OR **Website** → **Performance** → **Clear All Cache**
2. Click the button and wait for confirmation

#### Step 2: LiteSpeed Cache (if installed)

1. In **cPanel**, look for **"LiteSpeed Cache"**
2. If found:
   - Click on it
   - Click **"Purge All"** or **"Flush All"**
   - Confirm

#### Step 3: Cloudflare Cache (if using)

If your domain uses Cloudflare:

1. Login to **Cloudflare Dashboard**
2. Select your domain
3. Go to **Caching** tab
4. Click **"Purge Everything"**
5. Confirm purge
6. Wait for confirmation message

#### Step 4: Browser Cache

Clear your own browser cache:

1. **Windows/Linux:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

2. **Mac:**
   - Press `Cmd + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

**CHECKPOINT:** All caches cleared? ✅

---

### Phase 4: Verification

#### Test 1: Version Check

1. Open **new incognito/private window**
2. Go to: `https://jobguinee-pro.com/version.txt`
3. **Should show:** `1768097505`
4. If it shows anything else, cache not cleared

**EXPECTED:** `1768097505` ✅

---

#### Test 2: Homepage Load

1. Still in incognito window
2. Go to: `https://jobguinee-pro.com`
3. Press `Ctrl+Shift+R` (force refresh)
4. Page should load normally
5. Open **DevTools** (F12)
6. Check **Console** tab
7. **Should NOT see:**
   - `ERR_NAME_NOT_RESOLVED`
   - `Failed to fetch`
   - WebSocket connection errors to wrong URL

**EXPECTED:** No errors related to Supabase URL ✅

---

#### Test 3: Supabase Connection

1. In DevTools Console, run:
   ```javascript
   // Check what Supabase URL is being used
   console.log(document.head.innerHTML.includes('hhhjzgeidjgctuveopso'));
   // Should return true (correct URL without 'q')
   ```

2. Look for network requests:
   - Press **F12** → **Network** tab
   - Filter by "supabase"
   - **Should see:** `hhhjzgeidjgctuveopso.supabase.co` (with 'g')
   - **Should NOT see:** `hhhjzgeidjqctuveopso.supabase.co` (with 'q')

**EXPECTED:** All requests to correct URL ✅

---

#### Test 4: Authentication

1. Try to **Sign Up** or **Login**
2. Should work without errors
3. Check Console for any errors
4. Should successfully create session

**EXPECTED:** Authentication works ✅

---

#### Test 5: WebSocket Connection

1. Keep DevTools Console open
2. Navigate around the site
3. Check for WebSocket messages
4. **Should NOT see:**
   - `WebSocket connection to 'wss://hhhjzgeidjqctuveopso.supabase.co/...' failed`
   - (Note the 'q' in URL)
5. **Should see:**
   - Successful WebSocket connections to `hhhjzgeidjgctuveopso.supabase.co`
   - Or no WebSocket errors at all

**EXPECTED:** No WebSocket errors to wrong URL ✅

---

#### Test 6: Full Functionality

Test these features:

- [x] Homepage loads
- [x] Jobs list loads
- [x] Job detail pages work
- [x] Login/Signup functional
- [x] Candidate dashboard accessible
- [x] Recruiter dashboard accessible
- [x] Profile updates work
- [x] Realtime features work
- [x] No console errors

**EXPECTED:** All features functional ✅

---

## 🐛 Troubleshooting

### Problem: Still seeing old Supabase URL

**Symptoms:**
- Network requests still going to `hhhjzgeidjqctuveopso` (with 'q')
- Same WebSocket errors

**Solutions:**

1. **Wait 5 minutes**
   - DNS and CDN propagation takes time
   - Don't panic immediately

2. **Check version.txt again**
   ```
   https://jobguinee-pro.com/version.txt
   ```
   - If still showing old timestamp, cache not cleared
   - Repeat cache clearing steps

3. **Check if correct files uploaded**
   - Login to cPanel File Manager
   - Open `public_html/index.html`
   - Search for "1768097505" (should be in HTML comment)
   - If not found, files didn't upload correctly

4. **Verify bundle has correct URL**
   - In cPanel File Manager
   - Go to `public_html/assets/`
   - Find `index-D7SbprnI.js`
   - Download and search for "hhhjzgeidjgctuveopso"
   - Should find the CORRECT URL (with 'g')

5. **Nuclear option: Clear everything again**
   - Delete all files in `public_html/`
   - Restart from Step 3 of Phase 2

---

### Problem: 404 errors on routes

**Symptoms:**
- `/jobs` or other routes show 404
- Only homepage works

**Solutions:**

1. **Check .htaccess exists**
   - In `public_html/`, look for `.htaccess`
   - If missing, extract the ZIP again

2. **Verify .htaccess content**
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

3. **Check file permissions**
   - `.htaccess` should be `644`

---

### Problem: Blank page or white screen

**Symptoms:**
- Site loads but shows nothing
- Console shows JavaScript errors

**Solutions:**

1. **Check console errors**
   - Press F12
   - Look for specific error messages
   - Check if assets are loading (Network tab)

2. **Verify assets folder**
   - Go to `public_html/assets/`
   - Should contain ~200 JavaScript files
   - Check if they're accessible

3. **Clear browser cache again**
   - Use incognito mode
   - Hard refresh (Ctrl+Shift+R)

---

### Problem: Files won't upload

**Symptoms:**
- Upload fails or times out
- ZIP too large error

**Solutions:**

1. **Upload via FTP instead**
   - Use FileZilla or similar
   - Connect to your Hostinger FTP
   - Upload files directly from `dist/` folder
   - Don't use ZIP, upload folder contents

2. **Increase upload limits**
   - In cPanel, check PHP settings
   - Increase `upload_max_filesize`
   - Increase `post_max_size`

3. **Use smaller chunks**
   - Extract the ZIP on your computer
   - Upload `assets/` folder separately
   - Upload remaining files separately

---

## ⚡ Emergency Rollback

If everything fails and site is broken:

### Step 1: Restore Backup

1. Login to cPanel File Manager
2. Go to `public_html/`
3. Delete all current files
4. Upload `backup-before-force-deploy-1768097505.zip`
5. Extract it
6. Site should be back to previous state

### Step 2: Investigate

1. Check what went wrong
2. Review error messages
3. Verify ZIP package integrity
4. Try deployment again with fixes

---

## 📋 Final Checklist

Before considering deployment successful:

- [ ] `version.txt` shows: `1768097505`
- [ ] Homepage loads without errors
- [ ] Console shows no Supabase URL errors
- [ ] Network requests go to correct Supabase URL (with 'g')
- [ ] Login/Signup works
- [ ] No WebSocket errors
- [ ] All main features functional
- [ ] Tested in incognito mode
- [ ] Tested on mobile browser
- [ ] Backup safely stored

---

## 🎯 Summary

**What we're doing:**
1. ✅ Built correct production bundle with fixed Supabase URL
2. ✅ Created cache-busting deployment package
3. 🔄 Complete cleanup of production server
4. 🔄 Upload and extract fresh build
5. 🔄 Clear all caches (Hostinger, CDN, browser)
6. 🔄 Verify deployment success

**Why it's necessary:**
- Production is serving cached old files
- Old files have wrong Supabase URL
- WebSocket and Auth are failing
- Complete cleanup ensures no cache remnants

**Expected outcome:**
- ✅ Production serves correct build
- ✅ Supabase URL is correct everywhere
- ✅ WebSocket connections work
- ✅ Authentication works
- ✅ All features functional

---

**Package:** `jobguinee-production-force-deploy-1768097505.zip`
**Timestamp:** 1768097505
**Deploy NOW to fix production!**
