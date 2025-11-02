# Environment Variables Reference

This document lists all environment variables required for Bid Master University.

## Quick Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in all required values from your service providers

3. Restart your development server:
   ```bash
   npm run dev
   ```

---

## Required Environment Variables

### Supabase Configuration

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL | [Supabase Dashboard](https://supabase.com/dashboard/project/[PROJECT-ID]/settings/api) → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key | [Supabase Dashboard](https://supabase.com/dashboard/project/[PROJECT-ID]/settings/api) → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (secret!) | [Supabase Dashboard](https://supabase.com/dashboard/project/[PROJECT-ID]/settings/api) → service_role secret key |

### Database Configuration

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `DATABASE_URL` | ✅ | Connection pooling URL (port 6543) | [Supabase Dashboard](https://supabase.com/dashboard/project/[PROJECT-ID]/settings/database) → Connection pooling URL |
| `DIRECT_URL` | ✅ | Direct connection URL (port 5432) | [Supabase Dashboard](https://supabase.com/dashboard/project/[PROJECT-ID]/settings/database) → Connection string |

**Note**: 
- Use connection pooling URL (`:6543`) for `DATABASE_URL` in production
- Use direct connection URL (`:5432`) for `DIRECT_URL` (migrations, Prisma Studio)

### Application Configuration

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL of your application | `http://localhost:3000` (dev) or `https://your-domain.com` (prod) |
| `NEXT_PUBLIC_BASE_URL` | ✅ | Base URL for API calls | `http://localhost:3000` (dev) or `https://your-domain.com` (prod) |
| `NEXT_PUBLIC_SITE_URL` | ⚠️ | Site URL (used in some auth flows) | `http://localhost:3000` (dev) or `https://your-domain.com` (prod) |

### Email Service (Resend)

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `RESEND_API_KEY` | ✅ | Resend API key | [Resend Dashboard](https://resend.com/api-keys) → Create API Key |
| `EMAIL_FROM` | ✅ | Email sender address | Use `onboarding@resend.dev` for testing, or verify a domain in Resend dashboard |

### Cron Jobs

| Variable | Required | Description | How to Generate |
|----------|----------|-------------|-----------------|
| `CRON_SECRET` | ✅ | Secret for protecting cron endpoints | Run: `openssl rand -base64 32` or `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `VERCEL_CRON_SECRET` | ⚠️ | Automatically set by Vercel | Auto-set by Vercel (can be used instead of `CRON_SECRET`) |

### SEO & Search Engines

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `ALLOW_SEARCH_ENGINE_INDEXING` | ⚠️ | Allow search engines to index the site | `false` (internal platform) |

### Optional: Analytics & Monitoring

| Variable | Required | Description | Where to Get |
|----------|----------|-------------|--------------|
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | ❌ | Vercel Analytics ID | Auto-set by Vercel if enabled |
| `NEXT_PUBLIC_GA_ID` | ❌ | Google Analytics ID | [Google Analytics](https://analytics.google.com/) |

---

## Environment Variable Reference

### Complete .env.local Example

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Email Service (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=onboarding@resend.dev

# Cron Jobs
CRON_SECRET=your_random_secret_string_here

# SEO & Search Engines
ALLOW_SEARCH_ENGINE_INDEXING=false
```

---

## Production Environment Variables

For production (Vercel), set these in Vercel Dashboard → Settings → Environment Variables:

### Required for Production

1. **Supabase**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Database**:
   - `DATABASE_URL` (connection pooling URL, port 6543)
   - `DIRECT_URL` (direct connection URL, port 5432)

3. **Application**:
   - `NEXT_PUBLIC_APP_URL` (your Vercel deployment URL or custom domain)
   - `NEXT_PUBLIC_BASE_URL` (same as above)
   - `NEXT_PUBLIC_SITE_URL` (same as above)

4. **Email**:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (use verified domain for production)

5. **Cron**:
   - `CRON_SECRET` (or use Vercel's auto-set `VERCEL_CRON_SECRET`)

6. **SEO**:
   - `ALLOW_SEARCH_ENGINE_INDEXING` (set to `false` for internal platform)

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Keep secrets secure**: Don't share `SUPABASE_SERVICE_ROLE_KEY` or `CRON_SECRET`
3. **Use different values for development and production**
4. **Rotate secrets regularly** (especially if exposed)
5. **Use Vercel's environment variables** for production (not hardcoded)

---

## Troubleshooting

### Missing Environment Variables

If you see errors about missing environment variables:

1. Check `.env.local` exists in project root
2. Verify all required variables are set
3. Restart your development server
4. Check variable names are correct (case-sensitive)

### Database Connection Issues

If database connection fails:

1. Verify `DATABASE_URL` is correct
2. Check database password is correct
3. Ensure Supabase project is not paused
4. Use connection pooling URL (port 6543) for production

### Email Service Issues

If emails aren't sending:

1. Check `RESEND_API_KEY` is valid
2. Verify `EMAIL_FROM` is set correctly
3. Check Resend dashboard for API key status
4. Verify domain is verified in Resend (if using custom domain)

---

## Support

For help:
- Check [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for deployment guide
- Check [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for deployment checklist
- Consult service provider documentation:
  - [Supabase Docs](https://supabase.com/docs)
  - [Resend Docs](https://resend.com/docs)
  - [Vercel Docs](https://vercel.com/docs)

