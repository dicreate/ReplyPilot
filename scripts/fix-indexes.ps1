# PowerShell script to fix MongoDB index conflicts
# Run this from the project root directory

Write-Host "🔧 MongoDB Index Fix Script" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\.env")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor Red
    Write-Host "   where you can see the backend and frontend folders" -ForegroundColor Yellow
    exit 1
}

# Check if MongoDB is running
$mongoProcess = Get-Process -Name "mongod" -ErrorAction SilentlyContinue
if (-not $mongoProcess) {
    Write-Host "⚠️  MongoDB doesn't appear to be running" -ForegroundColor Yellow
    Write-Host "   Please start MongoDB first" -ForegroundColor Yellow
}

Write-Host "📋 To fix index conflicts, you can:" -ForegroundColor Green
Write-Host ""
Write-Host "1. Drop the entire database (CAUTION: This will delete all data):" -ForegroundColor Yellow
Write-Host "   mongo instagram_auto_reply --eval 'db.dropDatabase()'" -ForegroundColor White
Write-Host ""
Write-Host "2. Or drop specific problematic indexes:" -ForegroundColor Yellow
Write-Host "   mongo instagram_auto_reply --eval 'db.keywords.dropIndexes()'" -ForegroundColor White
Write-Host "   mongo instagram_auto_reply --eval 'db.analytics.dropIndexes()'" -ForegroundColor White
Write-Host ""
Write-Host "3. Then restart your backend server:" -ForegroundColor Yellow
Write-Host "   cd backend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "💡 The application will recreate the indexes automatically on startup" -ForegroundColor Cyan