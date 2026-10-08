# PowerShell script to test Instagram Graph API token
# Run this from the project root directory

Write-Host "🔍 Testing Instagram Graph API Token" -ForegroundColor Cyan
Write-Host ""

$ACCESS_TOKEN = "EAAtGmu4467ABPD70lLxRHqZCaxdbMQlYHDhXHqntRH1hJCo1SySG9poD2oYQw40b0lHfsV0M08I5OBW7CZCHDhHNVecS8AtC470npBbhZAhSKcgZCnzbeECF4pwToWT0FZAyHinDLKvb8b3C2YLLZCjZAKStwQzgAGjxgtCuIJv2zI2JlTaEOJNtEZCZCbvWERKAe"

Write-Host "🔑 Token: $($ACCESS_TOKEN.Substring(0,20))..." -ForegroundColor Yellow
Write-Host ""

Write-Host "🧪 Test these URLs in your browser:" -ForegroundColor Green
Write-Host ""

Write-Host "1. User Profile:" -ForegroundColor Yellow
Write-Host "https://graph.facebook.com/me?access_token=$ACCESS_TOKEN" -ForegroundColor White
Write-Host ""

Write-Host "2. Token Permissions:" -ForegroundColor Yellow
Write-Host "https://graph.facebook.com/me/permissions?access_token=$ACCESS_TOKEN" -ForegroundColor White
Write-Host ""

Write-Host "3. User's Facebook Pages:" -ForegroundColor Yellow
Write-Host "https://graph.facebook.com/me/accounts?access_token=$ACCESS_TOKEN" -ForegroundColor White
Write-Host ""

Write-Host "4. Instagram Business Accounts:" -ForegroundColor Yellow
Write-Host "https://graph.facebook.com/me/accounts?fields=instagram_business_account&access_token=$ACCESS_TOKEN" -ForegroundColor White
Write-Host ""

Write-Host "💡 Copy and paste these URLs in your browser to see what your token can access!" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Meanwhile, try the OAuth login from your frontend - CORS should now be fixed!" -ForegroundColor Green