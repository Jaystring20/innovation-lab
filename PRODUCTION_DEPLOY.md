# STEAM Foundry - Production Deployment Checklist

## Pre-Deployment (48 Hours Before)

### Code Quality
- [ ] All tests passing: `npm run test`
- [ ] All E2E tests passing: `npm run test:e2e`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] No ESLint warnings: `npm run lint`
- [ ] Build succeeds locally: `npm run build`

### Code Review
- [ ] All changes reviewed and approved
- [ ] No commented-out code
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments in critical paths

### Security Check
- [ ] No hardcoded credentials in code
- [ ] All secrets in .env.example with placeholder values
- [ ] Supabase RLS policies reviewed
- [ ] Auth tokens have proper expiration
- [ ] File upload validation in place

### Documentation
- [ ] CHANGELOG.md updated
- [ ] API changes documented
- [ ] New features documented
- [ ] Breaking changes listed

### Testing
- [ ] Manual smoke test on staging
- [ ] Test all user flows:
  - [ ] Teacher login → dashboard → submission
  - [ ] Judge login → scoring
  - [ ] Organizer login → console
  - [ ] File upload with offline simulation
  - [ ] Mobile responsiveness

## Deployment Day

### 1 Hour Before: Final Checks

```bash
# Pull latest changes
git pull origin main

# Verify build
npm run build

# Check bundle size
npm run build -- --report

# No uncommitted changes
git status
```

### Checklist
- [ ] Team notified of deployment window
- [ ] Slack notification posted
- [ ] Database backups triggered
- [ ] Rollback plan confirmed

### Deploy Steps

**Option A: Automatic (GitHub → Vercel)**
```bash
# Just push to main
git push origin main

# Vercel auto-deploys
# Monitor at: https://vercel.com/dashboard
```

**Option B: Manual (Vercel CLI)**
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

### 2. Verify Deployment

```bash
# Check deployment status
vercel ls

# Get production URL
vercel ls | grep "production"

# Test production URL
curl https://your-production-url.vercel.app

# Check health endpoint (if available)
curl https://your-production-url.vercel.app/health
```

### 3. Post-Deployment Tests (15 minutes)

**Critical Path Tests:**
```bash
# Test landing page
curl https://your-production-url.vercel.app/ -I

# Test login endpoint
curl https://your-production-url.vercel.app/lab -I

# Test organizer console
curl https://your-production-url.vercel.app/organizer -I
```

**Manual Browser Tests:**
- [ ] Landing page loads (check homepage)
- [ ] Teacher login works
- [ ] Judge login works
- [ ] Organizer login works
- [ ] Dashboard loads team data
- [ ] File upload works
- [ ] Navigation works on mobile

### 4. Monitor First Hour

**Check Vercel Dashboard:**
- [ ] Build logs show success
- [ ] No errors in Function logs
- [ ] Response times normal
- [ ] No spike in error rate

**Check Sentry (if enabled):**
```bash
# Login to Sentry and check:
# - No new error patterns
# - Error rate < 0.1%
# - Response times < 500ms median
```

**Check Application:**
- [ ] Users can log in
- [ ] Teachers can see teams
- [ ] Judges can score submissions
- [ ] Organizers can view console
- [ ] File uploads work

### 5. Announce Deployment

**Slack Message Template:**
```
🚀 STEAM Foundry deployed to production!
Version: v1.0.0
URL: https://your-domain.com
Changes: <link to release notes>
Status: ✅ All systems operational
Deployment time: <duration>
```

## Post-Deployment (24 Hours After)

### Monitoring
- [ ] Check error rates in Vercel/Sentry
- [ ] Monitor database performance
- [ ] Check file upload success rate
- [ ] Monitor auth flow completion

### User Feedback
- [ ] No major user complaints
- [ ] Support tickets normal
- [ ] Performance feedback positive

### Analytics
- [ ] Page load times acceptable
- [ ] No broken user flows
- [ ] Conversion metrics stable

## Rollback Procedure

### If Issues Found

**Quick Rollback (< 5 minutes):**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel auto-redeploys previous version
# Check status at: https://vercel.com/dashboard
```

**Manual Rollback (Vercel):**
1. Go to https://vercel.com/dashboard
2. Select `innovation-lab` project
3. Go to Deployments tab
4. Find previous successful deployment
5. Click 3-dot menu → "Promote to Production"

**Database Rollback (if needed):**
```bash
# Check recent backups in Supabase
# Restore from point-in-time recovery
# Contact Supabase support if needed
```

### Rollback Verification
- [ ] Revert to previous commit confirmed
- [ ] Vercel shows previous version as production
- [ ] Website confirms previous version
- [ ] Database rollback confirmed (if applied)
- [ ] Team notified of rollback

## Emergency Contacts

```
Deployment Lead: <name> - <phone/email>
Backend Support: <name> - <phone/email>
DevOps: <name> - <phone/email>
Database Admin: <name> - <phone/email>
```

## Deployment Windows

**Preferred Times:**
- Tuesday - Thursday
- 2-4 PM UTC (off-peak)
- 15+ minutes warning to users
- No deployment on Fridays/holidays

**Blackout Dates:**
- During active competition
- During peak user hours (9 AM - 5 PM local time)
- 48 hours before major exams

## Performance Targets

**Post-Deployment Metrics:**
| Metric | Target | Acceptable | Alert |
|--------|--------|----------|-------|
| Page Load | < 2.5s | < 3.5s | > 4s |
| API Response | < 200ms | < 500ms | > 1s |
| Error Rate | < 0.05% | < 0.1% | > 0.2% |
| Uptime | 99.9% | 99% | < 99% |

## Deployment Success Criteria

✅ **All Must Pass:**
- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] No new errors in Sentry
- [ ] Page load times < 4s
- [ ] Auth flows working
- [ ] File uploads working
- [ ] Team reports no issues

## Post-Launch Communication

### Slack Channels
- #deployments - announce deployment
- #status - any ongoing issues
- #engineering - technical details

### Email (if major feature)
Send to key stakeholders:
- What changed
- How it affects them
- Any action needed

### Support Docs
- Update FAQ if needed
- Add troubleshooting section
- Document new features

## Cleanup After Deploy

```bash
# Remove local build files
npm run clean

# Update local main branch
git pull origin main

# Check no uncommitted changes
git status

# Done!
git log --oneline -3
```

## Prevention & Learning

### Post-Mortem (if issues occurred)
- [ ] Document what went wrong
- [ ] Root cause analysis
- [ ] Action items to prevent recurrence
- [ ] Update this checklist

### Success Review (every deploy)
- [ ] What went well
- [ ] What can improve
- [ ] Update procedures if needed

---

**Next Deployment:** [DATE/TIME]  
**Last Deployment:** 2026-08-31  
**Status:** ✅ Ready for Production
