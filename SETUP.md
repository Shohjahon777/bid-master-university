# Environment Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## How to Get Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the Project URL and API keys
4. For DATABASE_URL, use the connection string from Settings → Database

## Database Migration

After setting up environment variables, run:

```bash
npx prisma db push
```

This will sync your Prisma schema with your Supabase database.