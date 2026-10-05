# Deployment Guide

Production deployment for STEAM Foundry Admin Dashboard

## Prerequisites

- Node.js 18+
- pnpm 8+
- Vercel account (or alternative host)
- Supabase project
- GitHub account with repository access

## Environment Setup

### Staging Environment

Create `.env.staging`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
NEXT_PUBLIC_ANALYTICS_ID=your-staging-analytics-id
SENTRY_DSN=your-staging-sentry-dsn
```

### Production Environment

Create `.env.production`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_ANALYTICS_ID=your-production-analytics-id
SENTRY_DSN=your-production-sentry-dsn
```

## Vercel Deployment

### 1. Connect Repository

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 2. Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add variables for each environment:
   - Staging (Preview)
   - Production

### 3. Enable CI/CD

Vercel automatically integrates with GitHub. Each push to:
- `develop` → Deploy to staging
- `main` → Deploy to production

## GitHub Actions

### 1. Set Secrets

In GitHub Settings → Secrets and variables → Actions:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID_STAGING=staging_project_id
VERCEL_PROJECT_ID_PRODUCTION=prod_project_id
SUPABASE_URL_TEST=https://test-project.supabase.co
SUPABASE_KEY_TEST=test-anon-key
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_KEY=prod-anon-key
```

### 2. Workflow Triggers

- **Push to develop**: Type check → Lint → Unit tests → Build → Deploy to staging
- **Push to main**: Type check → Lint → Unit tests → E2E tests → Build → Deploy to production
- **Pull requests**: Type check → Lint → Unit tests (no deploy)

## Database Migrations

### Apply Migrations

```bash
# Using Supabase CLI
supabase migration up

# Or manually run SQL files in Supabase dashboard
# In order:
# 1. 002_lab_learning_track.sql
# 2. 003_seed_primary_stage2.sql
# 3. 004_publish_primary_stage2.sql
# 5. 005_add_asset_system.sql
# 6. 006_competition_tables.sql
# 7. 007_admin_tables.sql
```

### Seed Data

```bash
# Run seed scripts
supabase db push --dry-run
supabase db push
```

## Testing Before Deployment

### Unit Tests

```bash
cd packages/admin
pnpm test:unit
```

### E2E Tests

```bash
# Start dev server
pnpm dev

# In another terminal
cd packages/admin
pnpm test:e2e
```

### Type Check

```bash
pnpm type-check
```

### Lint

```bash
pnpm lint
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Type check passes
- [ ] Lint passes
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Staging deployment successful
- [ ] Feature tested in staging

### Deployment
- [ ] Tag release: `git tag v1.0.0`
- [ ] Push to main: `git push origin main`
- [ ] GitHub Actions workflow runs
- [ ] Vercel deployment completes
- [ ] Health check passes
- [ ] Monitor errors in Sentry

### Post-Deployment
- [ ] Verify features work in production
- [ ] Check performance metrics
- [ ] Monitor error logs
- [ ] Update status page if needed
- [ ] Notify team of deployment

## Rollback Procedure

If issues occur after deployment:

### Option 1: Revert Last Commit

```bash
git revert HEAD
git push origin main
# Vercel will auto-deploy the revert
```

### Option 2: Deploy Previous Version

In Vercel Dashboard:
1. Go to Deployments
2. Find the previous successful deployment
3. Click "Redeploy"

### Option 3: Emergency Fix

```bash
# Create hotfix branch
git checkout -b hotfix/critical-issue

# Make fix
# Test locally

# Push to main
git push origin hotfix/critical-issue
git checkout main
git merge hotfix/critical-issue
git push origin main
```

## Monitoring

### Error Tracking

- **Sentry**: Monitor errors in production
- **Vercel Analytics**: Track performance
- **Google Analytics**: Track user behavior

### Performance Monitoring

Track Core Web Vitals:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)

### Uptime Monitoring

Use a service like Uptime Robot or Pingdom to monitor:
- `https://yourdomain.com/api/health`
- `https://yourdomain.com/dashboard`

## Scaling

### Increase Vercel Resources

1. Go to Vercel Dashboard → Project Settings
2. Under "Functions", increase memory and timeout
3. Consider upgrading to Pro plan for:
   - Priority support
   - Larger deployments
   - Custom domains

### Supabase Scaling

1. Go to Supabase Dashboard
2. Project Settings → Compute → Change compute size
3. Monitor database connections and query performance

### CDN Optimization

1. Enable image optimization in next.config.js
2. Use Vercel's edge functions for:
   - Request routing
   - Response rewriting
   - A/B testing

## Security Checklist

- [ ] Environment variables are secrets (never committed)
- [ ] HTTPS enforced (automatic with Vercel)
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Database backups enabled
- [ ] Regular security updates
- [ ] DDoS protection enabled

## Maintenance

### Regular Updates

```bash
# Check for outdated packages
pnpm outdated

# Update dependencies
pnpm update

# Run tests after updates
pnpm test:unit
pnpm test:e2e
```

### Database Maintenance

- Monitor query performance
- Check table sizes
- Clean up old logs
- Backup regularly

### Health Checks

Daily:
- Monitor error rates
- Check performance metrics
- Verify critical features work

Weekly:
- Review analytics
- Update dependencies
- Audit security logs

Monthly:
- Database optimization
- Performance review
- Capacity planning

## Disaster Recovery

### Backup & Recovery

Supabase provides:
- Daily automated backups
- Point-in-time restore
- Export functionality

### Data Recovery

```bash
# Download backup
supabase db download backup.sql

# Restore from backup
supabase db restore backup.sql
```

### Emergency Support

- Contact Vercel support: vercel.com/support
- Contact Supabase support: supabase.com/support
- GitHub issues: github.com/your-repo/issues

## Troubleshooting

### Deployment Fails

1. Check GitHub Actions logs
2. Verify environment variables
3. Check Vercel build logs
4. Verify database migrations

### High Error Rate

1. Check Sentry errors
2. Review recent changes
3. Check database connectivity
4. Review logs for patterns

### Performance Issues

1. Check Core Web Vitals
2. Review database query performance
3. Check for N+1 queries
4. Review image optimization

## Documentation

- Keep deployment docs updated
- Document any custom setup
- Record any known issues
- Share runbooks with team

## Contact & Support

- **On-call**: [escalation process]
- **Slack channel**: #deployments
- **Runbooks**: /docs/runbooks
