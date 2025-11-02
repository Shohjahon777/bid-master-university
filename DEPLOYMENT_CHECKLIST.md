# Deployment Checklist

Use this checklist to ensure everything is ready before deploying Bid Master University to production.

## Pre-Deployment

### Environment Variables

#### Required Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (secret!)
- [ ] `DATABASE_URL` - Database connection pooling URL (port 6543)
- [ ] `DIRECT_URL` - Database direct connection URL (port 5432)
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL of your application
- [ ] `NEXT_PUBLIC_BASE_URL` - Production base URL
- [ ] `RESEND_API_KEY` - Resend API key for emails
- [ ] `EMAIL_FROM` - Email sender address
- [ ] `CRON_SECRET` - Secret for protecting cron endpoints

#### Optional Variables
- [ ] `ALLOW_SEARCH_ENGINE_INDEXING` - Set to `false` for internal platform
- [ ] `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` - Vercel analytics (if enabled)

### Database Setup

- [ ] Supabase project created
- [ ] Database password set and saved securely
- [ ] All migrations applied (`npx prisma db push`)
- [ ] Prisma Client generated (`npx prisma generate`)
- [ ] Tables verified in Supabase Dashboard
- [ ] Indexes created and verified
- [ ] Row Level Security (RLS) configured
- [ ] Connection pooling enabled
- [ ] Database backup strategy in place

### Email Service

- [ ] Resend account created
- [ ] API key generated
- [ ] Domain verified (optional, recommended for production)
- [ ] Test email sent successfully
- [ ] Email templates tested

### Application Code

- [ ] All code committed to Git
- [ ] No TypeScript errors (`npm run build`)
- [ ] No linting errors
- [ ] Build succeeds locally
- [ ] `vercel.json` configured correctly
- [ ] `.env.example` created and documented
- [ ] `.env.local` in `.gitignore` (not committed)

### Testing

#### Critical User Flows
- [ ] User registration works
- [ ] User login works
- [ ] Create auction works
- [ ] Place bid works
- [ ] Send message works
- [ ] Watchlist works
- [ ] Notifications work

#### Error Handling
- [ ] Error boundaries tested
- [ ] Loading states work
- [ ] Form validation works
- [ ] API error handling works

#### Responsive Design
- [ ] Mobile view tested
- [ ] Tablet view tested
- [ ] Desktop view tested
- [ ] Navigation works on all devices

## Deployment

### Vercel Setup

- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported to Vercel
- [ ] All environment variables added in Vercel dashboard
- [ ] Build settings configured
- [ ] Region selected (matches Supabase region)

### Deployment Process

- [ ] Code pushed to GitHub
- [ ] Deployment triggered
- [ ] Build completes successfully
- [ ] No deployment errors

### Post-Deployment

#### Verification
- [ ] Site accessible at deployment URL
- [ ] Health endpoint works (`/health`)
- [ ] Homepage loads correctly
- [ ] No console errors in browser

#### Cron Jobs
- [ ] Cron jobs configured in Vercel
- [ ] End auctions cron active (every 5 minutes)
- [ ] Reminders cron active (hourly)
- [ ] Cleanup cron active (daily at 2 AM)
- [ ] Cron secret verified

#### Email Service
- [ ] Test email sent successfully
- [ ] Welcome email works
- [ ] Bid notifications work
- [ ] Email logs visible in Resend dashboard

#### Database
- [ ] Database connections working
- [ ] Queries executing successfully
- [ ] Connection pooling active
- [ ] Performance acceptable

#### Security
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secure (not in code)
- [ ] RLS policies active
- [ ] API endpoints protected
- [ ] Security headers configured

## Post-Deployment Testing

### Functional Testing
- [ ] Register new user
- [ ] Login with existing user
- [ ] Create new auction
- [ ] Place bid on auction
- [ ] Send message to user
- [ ] View dashboard
- [ ] View profile
- [ ] Search auctions
- [ ] Filter auctions
- [ ] View auction details

### Performance Testing
- [ ] Page load times acceptable
- [ ] Images load correctly
- [ ] No slow queries
- [ ] Bundle size reasonable
- [ ] No memory leaks

### Monitoring
- [ ] Error tracking set up (if applicable)
- [ ] Analytics configured (if applicable)
- [ ] Logs accessible
- [ ] Monitoring dashboard active

## Final Checks

- [ ] Custom domain configured (if applicable)
- [ ] DNS records updated (if custom domain)
- [ ] SSL certificate active (automatic on Vercel)
- [ ] All documentation updated
- [ ] Team notified of deployment
- [ ] Rollback plan ready (if needed)

## Sign-Off

- [ ] Development team review complete
- [ ] QA testing complete
- [ ] Product owner approval
- [ ] Ready for production use

---

**Deployment Date**: _______________
**Deployed By**: _______________
**Version**: _______________
**Deployment URL**: _______________

