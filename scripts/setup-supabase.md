# Supabase Database Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with your account
3. Click "New Project"
4. Enter project details:
   - **Name**: `bid-master-university`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click "Create new project"

## 2. Get Connection Details

Once your project is created:

1. Go to **Settings** → **Database**
2. Copy the **Connection string** (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL**: `https://[PROJECT-REF].supabase.co`
   - **anon public key**: `eyJ...` (long string)
   - **service_role secret key**: `eyJ...` (long string)

## 3. Update Environment Variables

Create/update `.env.local` file in your project root:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# App
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

## 4. Run Database Migration

After updating the environment variables:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Optional: Seed the database
npx prisma db seed
```

## 5. Enable Row Level Security (RLS)

In Supabase Dashboard:

1. Go to **Authentication** → **Policies**
2. Enable RLS for all tables:
   - `users`
   - `auctions` 
   - `bids`
   - `notifications`

## 6. Set up Authentication

1. Go to **Authentication** → **Settings**
2. Configure:
   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`
3. Enable email confirmations

## 7. Test Connection

```bash
# Test database connection
npx prisma db pull

# Start development server
npm run dev
```

## 8. Verify Setup

1. Check that your app loads without errors
2. Try registering a new user
3. Check Supabase Dashboard to see the user record
4. Test login functionality
