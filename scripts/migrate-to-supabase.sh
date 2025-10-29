#!/bin/bash
set -e
# Supabase Migration Script
echo "🚀 Migrating to Supabase PostgreSQL..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials first."
    echo "See scripts/setup-supabase.md for instructions."
    exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema to Supabase
echo "🗄️ Pushing schema to Supabase..."
npx prisma db push

# Verify connection
echo "🔍 Verifying database connection..."
npx prisma db pull

echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Check your Supabase dashboard to see the tables"
echo "2. Set up Row Level Security (RLS) policies"
echo "3. Configure authentication settings"
echo "4. Test your application"
