# PowerShell script to debug Facebook app configuration
# Run this from the project root directory

Write-Host "🔍 Debugging Facebook App Configuration" -ForegroundColor Cyan
Write-Host ""

$APP_ID = "3173855979432880"
$APP_SECRET = "24bee85886c45d9dbcacdfb7c300d076"

Write-Host "📋 App Credentials:" -ForegroundColor Yellow
Write-Host "   App ID: $APP_ID" -ForegroundColor White
Write-Host "   App Secret: $($APP_SECRET.Substring(0,10))..." -ForegroundColor White
Write-Host ""

Write-Host "🔧 Manual Checks You Need to Do:" -ForegroundColor Green
Write-Host ""

Write-Host "1. Check App Mode:" -ForegroundColor Yellow
Write-Host "   - Go to: https://developers.facebook.com/apps/$APP_ID/settings/basic/" -ForegroundColor White
Write-Host "   - Look for 'App Mode' - should be 'Development' or 'Live'" -ForegroundColor White
Write-Host "   - If Development, only app roles/testers can use it" -ForegroundColor White
Write-Host ""

Write-Host "2. Check App Domains:" -ForegroundColor Yellow
Write-Host "   - In Settings → Basic" -ForegroundColor White
Write-Host "   - App Domains should include: xr9mbjzk-5173.inc1.devtunnels.ms" -ForegroundColor White
Write-Host ""

Write-Host "3. Check Instagram Basic Display:" -ForegroundColor Yellow
Write-Host "   - Go to: https://developers.facebook.com/apps/$APP_ID/instagram-basic-display/basic-display/" -ForegroundColor White
Write-Host "   - Valid OAuth Redirect URIs should include:" -ForegroundColor White
Write-Host "     https://xr9mbjzk-5173.inc1.devtunnels.ms/auth/instagram/callback" -ForegroundColor White
Write-Host ""

Write-Host "4. Check Products Added:" -ForegroundColor Yellow
Write-Host "   - Instagram Basic Display ✓" -ForegroundColor White
Write-Host "   - Facebook Login ✓" -ForegroundColor White
Write-Host "   - Webhooks ✓" -ForegroundColor White
Write-Host ""

Write-Host "5. Test URLs:" -ForegroundColor Yellow
Write-Host "   - Try this Instagram auth URL in browser:" -ForegroundColor White
Write-Host "   https://api.instagram.com/oauth/authorize?client_id=$APP_ID&redirect_uri=https://xr9mbjzk-5173.inc1.devtunnels.ms/auth/instagram/callback&scope=user_profile,user_media&response_type=code" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Common Solutions:" -ForegroundColor Green
Write-Host "   - Add your tunnel domain to App Domains" -ForegroundColor White
Write-Host "   - Switch app to Live mode (if ready)" -ForegroundColor White
Write-Host "   - Add yourself as App Tester (if in Development)" -ForegroundColor White
Write-Host "   - Verify all redirect URIs match exactly" -ForegroundColor White