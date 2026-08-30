# STEAM Foundry Innovation Lab - Deployment Guide

## Overview

This guide covers deploying the STEAM Foundry Innovation Lab platform to production. The application is a Next.js/React monorepo deployed to Vercel with Supabase backend.

## Prerequisites

### Required Services
- **Vercel Account** - For hosting (https://vercel.com)
- **Supabase Project** - Database and auth (https://supabase.com)
- **GitHub Repository** - Source control (already set up)
- **Custom Domain** (optional) - For production URL

### Required Environment Variables
See `.env.example` in the repo for full list:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Authentication
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_SERVICE_KEY=your-service-key

# Email (for receipts, notifications)
RESEND_API_KEY=your-resend-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# WhatsApp
WHATSAPP_API_TOKEN=your-token
WHATSAPP_PHONE_ID=your-phone-id
```

## Step 1: Prepare Supabase

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Create new project
3. Choose region (closest to your users)
4. Note the project URL and anon key

### 1.2 Run Database Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

### 1.3 Create Storage Buckets
In Supabase dashboard → Storage:

1. **team-submissions** (public)
   - For student file uploads
   - Public read access
   - RLS: Allow authenticated users to upload

2. **order-proofs** (public)
   - For payment proof uploads
   - Public read access
   - RLS: Allow authenticated users to upload

### 1.4 Configure RLS Policies
See `supabase/migrations/` for exact SQL, or:

```sql
-- Allow authenticated uploads to team-submissions
CREATE POLICY "Teams can upload submissions"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-submissions');

-- Allow public read
CREATE POLICY "Public read submissions"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'team-submissions');
```

### 1.5 Set Up Auth
In Supabase dashboard → Auth:

1. Enable Email provider
2. Set email templates (optional but recommended)
3. Configure site URL and redirect URLs
4. Set JWT expiration (default 1 hour is fine)

## Step 2: Prepare Vercel

### 2.1 Create Vercel Project
1. Go to https://vercel.com
2. Import from GitHub
3. Select `innovation-lab` repository
4. Choose project name

### 2.2 Configure Build Settings
```
Framework: Vite (detects automatically)
Build Command: npm run build
Output Directory: dist
Root Directory: packages/lab/
```

### 2.3 Add Environment Variables
In Vercel dashboard → Settings → Environment Variables:

Add all variables from `.env.example`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `RESEND_API_KEY`
- `SMTP_*` variables
- `WHATSAPP_*` variables

**Important:** Add to all environments (Production, Preview, Development)

### 2.4 Connect Custom Domain (Optional)
1. Go to Vercel → Settings → Domains
2. Add custom domain
3. Update DNS records as instructed
4. Wait for verification (usually 5-10 minutes)

## Step 3: Deploy

### 3.1 First Deployment
Vercel auto-deploys on push to `main` branch:

```bash
# Push to main triggers deployment
git push origin main

# Monitor at https://vercel.com/dashboard
```

### 3.2 Monitor Deployment
1. Watch build logs in Vercel dashboard
2. Check for build errors
3. Verify preview URL works
4. Promote to production when ready

### 3.3 Post-Deployment Checks

**Login Pages:**
- [ ] `/organizer/login` loads without errors
- [ ] `/lab` (teacher login) loads correctly
- [ ] Email/password fields work

**Public Pages:**
- [ ] `/` (landing page) renders
- [ ] `/store` (store) loads
- [ ] `/order/:reference` works

**Authenticated Pages (need test accounts):**
- [ ] Teacher dashboard shows teams
- [ ] Judge dashboard shows queue
- [ ] Organizer console shows submissions

## Step 4: Configure Services

### 4.1 Email Service (Resend)
For payment receipts and notifications:

1. Create Resend account (https://resend.com)
2. Add domain (or use default Resend domain)
3. Add API key to Vercel
4. Test: `npm run test:email`

### 4.2 WhatsApp Integration (Optional)
For WhatsApp confirmations:

1. Set up Meta Business Account
2. Create WhatsApp Business App
3. Get API token and phone ID
4. Add to Vercel env vars
5. Configure webhook for replies

### 4.3 Analytics (Optional)
Add to `src/App.tsx` or `.vercel.json`:

```json
{
  "analytics": {
    "enabled": true
  }
}
```

## Step 5: Post-Launch Operations

### 5.1 Monitoring
Set up error tracking:
- Vercel Monitoring (built-in)
- Sentry (optional): `npm install @sentry/react`
- LogRocket (optional): `npm install logrocket`

### 5.2 Performance
Monitor Core Web Vitals in Vercel dashboard:
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

### 5.3 Backups
Set up Supabase backups:
1. Supabase dashboard → Settings → Backups
2. Enable daily backups
3. Test restore process monthly

### 5.4 Security Checklist
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] RLS policies enabled on all tables
- [ ] Service key stored securely (not in client code)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (on API routes)
- [ ] Environment variables not logged

## Rollback Procedure

### If deployment breaks:

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or rollback to previous Vercel deployment
# Vercel dashboard → Deployments → Select previous → Promote to Production
```

### Supabase Rollback:
```bash
# Revert last migration
supabase db push --dry-run  # Check what will revert
supabase db pull            # Get current state
```

## Scaling & Performance

### Database Optimization
- Enable read replicas for high traffic
- Set up connection pooling
- Monitor query performance

### CDN & Caching
- Vercel auto-caches static assets
- Set Cache-Control headers on API routes
- Use Supabase edge functions for compute

### Traffic Scaling
- Vercel auto-scales (no configuration needed)
- Monitor concurrent users in Vercel dashboard
- Upgrade Supabase tier if needed

## Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
vercel env pull
vercel build --prod
```

### Pages show 404
- Check Vercel root directory setting: `packages/lab/`
- Check redirect rules in `.vercel.json`

### Auth not working
- Verify Supabase URL and anon key in env vars
- Check site URL and redirects in Supabase auth settings
- Test in incognito to avoid cache issues

### File uploads fail
- Verify bucket exists in Supabase Storage
- Check RLS policies allow uploads
- Check file size limits

### Email not sending
- Verify Resend API key is correct
- Check email templates in Supabase
- Test with `npm run test:email`

## Maintenance Schedule

### Daily
- Monitor error logs in Vercel
- Check Supabase performance metrics

### Weekly
- Review analytics and user feedback
- Update dependencies: `npm outdated`

### Monthly
- Security audit (dependencies, permissions)
- Database backup test
- Performance review

### Quarterly
- Major dependency updates
- Security assessment
- Capacity planning

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev

## Contact

For deployment issues:
- Create issue on GitHub
- Check Vercel support documentation
- Contact Supabase support

---

**Last Updated:** 2026-08-31
**Version:** 1.0
**Status:** Production Ready
