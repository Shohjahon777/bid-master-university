# Supabase Migration Script for PowerShell
Write-Host "🚀 Migrating to Supabase PostgreSQL..." -ForegroundColor Green

# Check if .env.local exists
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ .env.local file not found!" -ForegroundColor Red
    Write-Host "Please create .env.local with your Supabase credentials first." -ForegroundColor Yellow
    Write-Host "See scripts/setup-supabase.md for instructions." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Blue
try {
    npx prisma generate
    if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed" }
} catch {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Push schema to Supabase
Write-Host "🗄️ Pushing schema to Supabase..." -ForegroundColor Blue
try {
    npx prisma db push
    if ($LASTEXITCODE -ne 0) { throw "Prisma db push failed" }
} catch {
    Write-Host "❌ Failed to push schema to Supabase" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Verify connection
Write-Host "🔍 Verifying database connection..." -ForegroundColor Blue
try {
    npx prisma db pull
    if ($LASTEXITCODE -ne 0) { throw "Prisma db pull failed" }
} catch {
    Write-Host "❌ Failed to verify database connection" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Migration complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check your Supabase dashboard to see the tables" -ForegroundColor White
Write-Host "2. Set up Row Level Security (RLS) policies" -ForegroundColor White
Write-Host "3. Configure authentication settings" -ForegroundColor White
Write-Host "4. Test your application" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to continue"
