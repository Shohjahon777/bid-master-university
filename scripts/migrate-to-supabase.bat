@echo off
setlocal enabledelayedexpansion

REM Supabase Migration Script for Windows
echo 🚀 Migrating to Supabase PostgreSQL...

REM Check if .env.local exists
if not exist ".env.local" (
    echo ❌ .env.local file not found!
    echo Please create .env.local with your Supabase credentials first.
    echo See scripts/setup-supabase.md for instructions.
    pause
    exit /b 1
)

echo ✅ Environment file found

REM Generate Prisma client
echo 📦 Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

REM Push schema to Supabase
echo 🗄️ Pushing schema to Supabase...
call npx prisma db push
if errorlevel 1 (
    echo ❌ Failed to push schema to Supabase
    pause
    exit /b 1
)

REM Verify connection
echo 🔍 Verifying database connection...
call npx prisma db pull
if errorlevel 1 (
    echo ❌ Failed to verify database connection
    pause
    exit /b 1
)

echo ✅ Migration complete!
echo.
echo Next steps:
echo 1. Check your Supabase dashboard to see the tables
echo 2. Set up Row Level Security (RLS) policies
echo 3. Configure authentication settings
echo 4. Test your application
echo.
pause
