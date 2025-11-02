# Deployment Guide - Bid Master University

Complete step-by-step guide for deploying Bid Master University to Vercel.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Preparation](#database-preparation)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment](#post-deployment)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ GitHub account and repository set up
- ✅ Vercel account (free tier is fine)
- ✅ Supabase account with project created
- ✅ Resend account for email service
- ✅ Node.js 18+ installed locally
- ✅ Git configured

---

## Environment Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login
3. Click "New Project"
4. Enter project details:
   - **Name**: `bid-master-university`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users (e.g., `US East` for `iad1`)
5. Click "Create new project"
6. Wait for project to finish provisioning (~2 minutes)

### 2. Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy the following:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public key**: `eyJ...` (long string starting with `eyJ`)
   - **service_role secret key**: `eyJ...` (long string - keep this secret!)

3. Go to **Settings** → **Database**
4. Copy the **Connection string**:
   - For direct connection (migrations): 
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```
   - For connection pooling (production):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
     ```

### 3. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up/Login
3. Go to **API Keys** → **Create API Key**
4. Copy your API key (starts with `re_`)
5. Verify your domain (optional, recommended for production):
   - Go to **Domains** → **Add Domain**
   - Add your domain (e.g., `bidmaster.university`)
   - Add DNS records as instructed
   - Wait for verification

### 4. Generate Cron Secret

Generate a secure random string for protecting cron endpoints:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Save this value - you'll need it for the `CRON_SECRET` variable.

---

## Database Preparation

### 1. Run Database Migrations

First, set up your local environment variables:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`

3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

4. Push schema to Supabase:
   ```bash
   npx prisma db push
   ```

   This will create all tables and indexes in your Supabase database.

### 2. Verify Database Setup

1. Open Prisma Studio to verify:
   ```bash
   npx prisma studio
   ```

2. Check that all tables are created:
   - `users`
   - `auctions`
   - `bids`
   - `notifications`
   - `watchlist`
   - `conversations`
   - `messages`
   - `email_logs`
   - `reports`

3. Verify indexes are created in Supabase Dashboard:
   - Go to **Database** → **Tables**
   - Check that indexes exist for frequently queried fields

### 3. Set Up Row Level Security (RLS)

In Supabase Dashboard:

1. Go to **Authentication** → **Policies**
2. Enable RLS for all tables (if not already enabled)
3. Create policies as needed for your security requirements

### 4. Configure Connection Pooling

For production, use Supabase connection pooling:

1. In Supabase Dashboard, go to **Settings** → **Database**
2. Use the connection pooling URL (port `6543`) for `DATABASE_URL`
3. Keep direct connection URL (port `5432`) for `DIRECT_URL` (migrations only)

---

## Pre-Deployment Checklist

Before deploying, verify all items are complete:

### Environment Variables

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `DATABASE_URL` set (connection pooling URL)
- [ ] `DIRECT_URL` set (direct connection URL)
- [ ] `NEXT_PUBLIC_APP_URL` set (production URL)
- [ ] `NEXT_PUBLIC_BASE_URL` set (production URL)
- [ ] `RESEND_API_KEY` set
- [ ] `EMAIL_FROM` set (verified domain or `onboarding@resend.dev`)
- [ ] `CRON_SECRET` set (random secure string)
- [ ] `ALLOW_SEARCH_ENGINE_INDEXING` set (`false` for internal platform)

### Database

- [ ] All migrations applied (`npx prisma db push`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Tables created and verified
- [ ] Indexes created
- [ ] RLS policies configured
- [ ] Connection pooling configured

### Email Service

- [ ] Resend account created
- [ ] API key generated
- [ ] Domain verified (optional, recommended for production)
- [ ] Test email sent successfully

### Application

- [ ] Build succeeds locally (`npm run build`)
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] All environment variables documented
- [ ] `vercel.json` configured
- [ ] `.env.example` created with all variables

### Testing

- [ ] Critical user flows tested:
  - [ ] User registration
  - [ ] User login
  - [ ] Create auction
  - [ ] Place bid
  - [ ] Send message
- [ ] Mobile responsiveness verified
- [ ] Error handling tested
- [ ] Loading states verified

---

## Deployment Steps

### Step 1: Prepare Repository

1. Ensure all changes are committed:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   ```

2. Push to GitHub:
   ```bash
   git push origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your repository:
   - Select your GitHub repository
   - Choose the repository
   - Click "Import"

### Step 3: Configure Project

1. **Project Settings**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

2. **Environment Variables**:
   
   Add all environment variables from `.env.example`:
   
   - Click "Environment Variables"
   - Add each variable:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://[PROJECT-REF].supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = [YOUR-ANON-KEY]
     SUPABASE_SERVICE_ROLE_KEY = [YOUR-SERVICE-ROLE-KEY]
     DATABASE_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
     DIRECT_URL = postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     NEXT_PUBLIC_APP_URL = https://your-domain.vercel.app
     NEXT_PUBLIC_BASE_URL = https://your-domain.vercel.app
     RESEND_API_KEY = re_[YOUR-RESEND-KEY]
     EMAIL_FROM = onboarding@resend.dev
     CRON_SECRET = [YOUR-GENERATED-SECRET]
     ALLOW_SEARCH_ENGINE_INDEXING = false
     ```
   
   ⚠️ **Important**: 
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (or custom domain if configured)
   - Use connection pooling URL for `DATABASE_URL` (port `6543`)
   - Use direct connection URL for `DIRECT_URL` (port `5432`)

3. **Regions**:
   - Set to match your Supabase region (e.g., `US East` for `iad1`)
   - This is configured in `vercel.json`

4. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `.next` (auto-detected)

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Monitor build logs for any errors

### Step 5: Post-Deployment Setup

After deployment succeeds:

1. **Update Environment Variables**:
   - Get your deployment URL from Vercel dashboard
   - Update `NEXT_PUBLIC_APP_URL` in Vercel with the actual URL
   - Update `NEXT_PUBLIC_BASE_URL` similarly
   - Redeploy to apply changes

2. **Configure Cron Jobs**:
   - Vercel will automatically set up cron jobs from `vercel.json`
   - Cron jobs will use `VERCEL_CRON_SECRET` (auto-set by Vercel)
   - You can also set `CRON_SECRET` manually

3. **Set Up Custom Domain** (Optional):
   - In Vercel Dashboard → **Settings** → **Domains**
   - Add your custom domain
   - Configure DNS as instructed
   - Update `NEXT_PUBLIC_APP_URL` to custom domain
   - Redeploy

---

## Post-Deployment

### 1. Verify Deployment

1. **Visit your site**: `https://your-domain.vercel.app`
2. **Check health endpoint**: `https://your-domain.vercel.app/health`
3. **Test critical flows**:
   - User registration
   - User login
   - Create auction
   - Place bid

### 2. Verify Cron Jobs

1. In Vercel Dashboard → **Settings** → **Cron Jobs**
2. Verify all 3 cron jobs are configured:
   - End auctions (every 5 minutes)
   - Send reminders (every hour)
   - Cleanup (daily at 2 AM)
3. Check logs for any errors

### 4. Verify Email Service

1. Test email sending:
   - Register a new user
   - Check if welcome email is sent
   - Check Resend dashboard for email logs
   - Verify email appears in inbox

### 5. Monitor Application

1. **Vercel Dashboard**:
   - Monitor deployment logs
   - Check analytics
   - Monitor function invocations

2. **Supabase Dashboard**:
   - Monitor database usage
   - Check query performance
   - Monitor storage usage

3. **Resend Dashboard**:
   - Monitor email delivery
   - Check bounce/complaint rates
   - Monitor API usage

---

## Troubleshooting

### Build Fails

**Error: Missing environment variables**
- Solution: Verify all required env vars are set in Vercel dashboard

**Error: Database connection failed**
- Solution: Check `DATABASE_URL` is correct and using connection pooling URL
- Verify database password is correct

**Error: Prisma Client not generated**
- Solution: Add `postinstall` script in `package.json`: `"postinstall": "prisma generate"`

### Runtime Errors

**Error: Supabase client not initialized**
- Solution: Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

**Error: Email sending failed**
- Solution: Check `RESEND_API_KEY` is valid
- Verify domain is verified in Resend (if using custom domain)

**Error: Cron jobs not running**
- Solution: Verify `vercel.json` is committed
- Check cron jobs are configured in Vercel dashboard
- Verify `CRON_SECRET` is set

### Database Issues

**Error: Connection timeout**
- Solution: Use connection pooling URL (`:6543`) for `DATABASE_URL`
- Check Supabase project is not paused

**Error: Too many connections**
- Solution: Use connection pooling (already configured)
- Check for connection leaks in code

### Performance Issues

**Slow page loads**
- Solution: Check image optimization is working
- Verify bundle sizes are reasonable
- Check database query performance

**High database usage**
- Solution: Review query patterns
- Ensure indexes are being used
- Consider caching expensive queries

---

## Additional Configuration

### Custom Domain

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add your domain
3. Configure DNS as instructed
4. Update environment variables with custom domain
5. Redeploy

### Analytics (Optional)

1. **Vercel Analytics**:
   - Enable in Vercel Dashboard → **Settings** → **Analytics**
   - Automatically tracks page views and performance

2. **Google Analytics**:
   - Add `NEXT_PUBLIC_GA_ID` environment variable
   - Configure in your analytics setup

### Backup Strategy

1. **Database Backups**:
   - Supabase automatically backs up your database daily
   - Go to **Database** → **Backups** to view/manage

2. **Manual Backup**:
   ```bash
   # Export database
   pg_dump -h db.[PROJECT-REF].supabase.co -U postgres -d postgres > backup.sql
   ```

### Monitoring

1. **Error Tracking** (Optional):
   - Consider adding Sentry or similar service
   - Configure error boundaries

2. **Performance Monitoring**:
   - Use Vercel Analytics
   - Monitor Core Web Vitals
   - Use Lighthouse for audits

---

## Maintenance

### Regular Tasks

- **Weekly**: Review error logs and fix issues
- **Monthly**: Review database performance and optimize queries
- **Quarterly**: Update dependencies and security patches

### Updates

1. **Dependency Updates**:
   ```bash
   npm update
   npm audit fix
   ```

2. **Database Migrations**:
   ```bash
   npx prisma db push
   ```

3. **Redeploy**:
   - Push changes to GitHub
   - Vercel will auto-deploy

---

## Security Checklist

- [ ] All environment variables set in Vercel (not in code)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is secret (never exposed to client)
- [ ] `CRON_SECRET` is set and secure
- [ ] RLS policies configured in Supabase
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers configured in `vercel.json`
- [ ] Input validation on all forms
- [ ] API endpoints protected with authentication
- [ ] Rate limiting considered (if needed)

---

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase dashboard for database issues
3. Check Resend dashboard for email issues
4. Review error logs in application
5. Consult documentation:
   - [Vercel Documentation](https://vercel.com/docs)
   - [Supabase Documentation](https://supabase.com/docs)
   - [Resend Documentation](https://resend.com/docs)
   - [Next.js Documentation](https://nextjs.org/docs)

---

## Quick Reference

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `DATABASE_URL` | ✅ | Connection pooling URL (port 6543) |
| `DIRECT_URL` | ✅ | Direct connection URL (port 5432) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of your app |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `EMAIL_FROM` | ✅ | Email sender address |
| `CRON_SECRET` | ✅ | Secret for cron endpoints |
| `ALLOW_SEARCH_ENGINE_INDEXING` | ⚠️ | Enable/disable search indexing |

### Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Resend Dashboard**: https://resend.com/dashboard
- **Project Repository**: [Your GitHub repo URL]

---

**Last Updated**: [Date]
**Version**: 1.0.0

