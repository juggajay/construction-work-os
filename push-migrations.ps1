$env:SUPABASE_ACCESS_TOKEN = "sbp_d8294d5b91c7bcd7d7229e014ada14ca6779d6d2"

Write-Host "🔗 Attempting to link project..." -ForegroundColor Cyan

# Try to link (might fail but that's okay if already linked)
& "C:\Users\jayso\scoop\shims\supabase.exe" link --project-ref tokjmeqjvexnmtampyjm --password "Jay210784" 2>&1 | Out-Null

Write-Host "📤 Pushing migrations to remote database..." -ForegroundColor Cyan

# Push migrations
& "C:\Users\jayso\scoop\shims\supabase.exe" db push

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Migrations pushed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Failed to push migrations" -ForegroundColor Red
    exit 1
}
