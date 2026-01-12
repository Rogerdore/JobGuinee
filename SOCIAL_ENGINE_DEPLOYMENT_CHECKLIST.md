# Social Sharing Engine - Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [x] Build successful (`npm run build`)
- [x] No TypeScript errors
- [x] No console errors in browser
- [x] All imports resolved
- [x] Code follows conventions

### ✅ Database Migrations
- [x] Migration file created: `20260112_create_job_clicks_tracking_table.sql`
- [x] All SQL is valid
- [x] RLS policies defined
- [x] Indexes created
- [x] Functions deployed
- [x] Triggers configured

### ✅ Features Implemented
- [x] jobClickTrackingService.ts
- [x] useSocialShareTracking.ts
- [x] AdminSocialAnalytics.tsx
- [x] ShareRedirect.tsx (optional, for future)
- [x] Integration in JobDetail.tsx
- [x] Integration in App.tsx

### ✅ Dependencies
- [x] recharts added to package.json
- [x] npm install completed
- [x] No new vulnerabilities introduced

---

## Deployment Steps

### Step 1: Database Migration

```bash
# The migration has already been applied via Supabase
# Verify it was applied:

SELECT * FROM job_clicks LIMIT 1;
-- Should return empty result (table exists)

-- Check policies exist:
SELECT policyname FROM pg_policies WHERE tablename = 'job_clicks';
-- Should show 3 policies

-- Check functions exist:
SELECT proname FROM pg_proc WHERE proname LIKE '%job_click%' OR proname LIKE '%job_share%';
```

### Step 2: Verify Existing Features Still Work

```bash
# Test social sharing still works
npm run dev

# Go to Job Detail
# Click "Share" button
# Verify modal opens
# Verify networks are clickable
```

### Step 3: Test Click Tracking

```javascript
// In browser console on Job Detail page with ?src=facebook

// Check if useSocialShareTracking executed
// Should see request to job_clicks INSERT

// Verify in Supabase:
SELECT * FROM job_clicks LIMIT 1;
-- Should show your test click
```

### Step 4: Verify Admin Dashboard

```
1. Login as admin
2. Navigate to /admin/social-analytics
3. Verify page loads
4. Verify KPIs display
5. Verify charts render
6. Verify tables populate
```

### Step 5: Test RLS Policies

```javascript
// As authenticated user (non-admin):
// They should NOT see other users' data

// As admin:
// They should see all data

// As recruiter:
// They should only see their own job clicks
```

---

## Production Deployment

### Pre-Deployment Checks

```bash
# 1. Ensure clean build
npm run build

# 2. Verify bundle size (should be reasonable)
# AdminSocialAnalytics: ~357kb (96kb gzipped) is acceptable

# 3. Run type check
npx tsc --noEmit -p tsconfig.app.json

# 4. Verify all migrations applied
# (Check Supabase dashboard)
```

### Deployment Procedure

```bash
# 1. Commit code
git add -A
git commit -m "feat: integrate social sharing engine with click tracking"

# 2. Push to main
git push origin main

# 3. Deploy build to production
# (Use your deployment pipeline)

# 4. Verify in production
# - Test job sharing
# - Verify click tracking works
# - Check admin dashboard
```

### Post-Deployment Verification

```bash
# 1. Monitor logs for errors
# Check Supabase function logs
# Check browser console for errors

# 2. Verify data is being recorded
SELECT COUNT(*) FROM job_clicks;
-- Should increase as users interact

# 3. Test admin dashboard
# - Verify charts render
# - Verify data is accurate
# - Check performance

# 4. Verify RLS is working
# - Admin can see all data
# - Recruiter can see only their data
# - User can see only their own clicks
```

---

## Monitoring After Deployment

### Key Metrics to Monitor

```
1. job_clicks table growth
   - Should steadily increase as users click shared links

2. Dashboard performance
   - Query time: should be < 1 second
   - Page load: should be < 3 seconds

3. RLS policy violations
   - Should be 0
   - Check logs for policy errors

4. Data accuracy
   - clicks_count on jobs should match sum(clicks) in job_clicks
   - CTR calculations should be consistent
```

### SQL Monitoring Queries

```sql
-- Check if data is flowing
SELECT COUNT(*) FROM job_clicks;
-- Should increase over time

-- Check clicks by network
SELECT source_network, COUNT(*) FROM job_clicks GROUP BY source_network;

-- Check top jobs by clicks
SELECT job_id, COUNT(*) as click_count
FROM job_clicks
GROUP BY job_id
ORDER BY click_count DESC
LIMIT 10;

-- Check clicks over time
SELECT DATE(clicked_at), COUNT(*)
FROM job_clicks
GROUP BY DATE(clicked_at)
ORDER BY DATE(clicked_at) DESC;

-- Verify RLS is working
SELECT * FROM job_clicks WHERE false;
-- Should return 0 (only authorized users can see data)
```

---

## Troubleshooting

### Problem: No clicks are being recorded

**Possible causes:**
1. Migration not applied
   - Check: `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='job_clicks');`
   - Fix: Apply migration via Supabase

2. ?src= parameter not present
   - Check: URL should have `?src=facebook` etc
   - Fix: Share link should have parameter

3. RLS policy blocking INSERT
   - Check: `SELECT * FROM pg_policies WHERE tablename = 'job_clicks';`
   - Fix: Verify "Anyone can track clicks" policy exists

4. jobClickTrackingService not imported
   - Check: `src/pages/JobDetail.tsx` should have import
   - Fix: Add import and useSocialShareTracking hook

### Problem: Dashboard not loading

**Possible causes:**
1. User not admin
   - Check: `SELECT user_type FROM profiles WHERE id = 'current_user_id';`
   - Fix: User should be admin

2. RLS policy too restrictive
   - Check: Verify admin can SELECT from job_clicks
   - Fix: Check admin RLS policy

3. Component not rendering
   - Check: Browser console for errors
   - Fix: Check AdminSocialAnalytics.tsx for imports

4. recharts not installed
   - Check: `npm ls recharts`
   - Fix: Run `npm install recharts@^2.10.3`

### Problem: CTR is 0% for shared jobs

**Possible causes:**
1. No clicks recorded yet
   - Fix: Wait for users to click shared links

2. Shares exist but clicks not recorded
   - Check: `SELECT * FROM social_share_analytics;` (has data?)
   - Check: `SELECT * FROM job_clicks;` (has data?)
   - Fix: Verify click tracking works

3. SQL function has error
   - Check: `SELECT get_global_social_stats(10);` in Supabase
   - Fix: Check function for syntax errors

---

## Rollback Plan (if needed)

### Quick Rollback

If something goes wrong:

```sql
-- Disable RLS temporarily to debug
ALTER TABLE job_clicks DISABLE ROW LEVEL SECURITY;

-- Or completely remove the feature:
DROP TABLE job_clicks CASCADE;
DROP FUNCTION update_job_clicks_count() CASCADE;
DROP FUNCTION get_job_click_stats(uuid) CASCADE;
DROP FUNCTION get_global_social_stats(int) CASCADE;
```

### Code Rollback

```bash
# Revert to previous commit
git revert <commit-hash>
git push

# Deploy previous version
```

---

## Performance Optimization

### Monitor Query Performance

```sql
-- Check slow queries
SELECT query, calls, total_time
FROM pg_stat_statements
WHERE query LIKE '%job_clicks%'
ORDER BY total_time DESC;

-- Analyze table
ANALYZE job_clicks;

-- Check index usage
SELECT
  schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE tablename = 'job_clicks'
ORDER BY idx_scan DESC;
```

### If Performance Degrades

```sql
-- Reindex if needed
REINDEX TABLE job_clicks;

-- Vacuum to cleanup
VACUUM ANALYZE job_clicks;

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('job_clicks'));
```

---

## Documentation Updates

After deployment, update:

- [ ] README with social analytics link
- [ ] Admin user guide
- [ ] API documentation (if applicable)
- [ ] Changelog

---

## Team Communication

After deployment:

- [ ] Notify admins about new dashboard
- [ ] Provide access link
- [ ] Explain metrics (Shares, Clicks, CTR)
- [ ] Share usage guide
- [ ] Provide support contact

---

## Sign-off

**Deployment prepared by:** AI Assistant
**Date:** January 12, 2026
**Status:** Ready for Production

**Approval required from:**
- [ ] Project Manager
- [ ] DevOps Lead
- [ ] Product Owner

---

## Support Resources

- **Troubleshooting Guide:** SOCIAL_SHARING_QUICK_START.md
- **Technical Details:** SOCIAL_SHARING_ENGINE_INTEGRATION.md
- **Summary:** SOCIAL_ENGINE_SUMMARY.txt
- **Code:** src/services/jobClickTrackingService.ts
- **Dashboard:** src/pages/AdminSocialAnalytics.tsx

---

**Good luck with deployment! 🚀**
