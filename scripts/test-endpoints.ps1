# PowerShell script to test compliance endpoints
# Run this from the project root directory

Write-Host "🔍 Testing Instagram DM Automation Endpoints" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$endpoints = @(
    @{ Path = "/health"; Name = "Health Check" },
    @{ Path = "/api/compliance/privacy-policy"; Name = "Privacy Policy" },
    @{ Path = "/api/compliance/terms"; Name = "Terms of Service" },
    @{ Path = "/api/compliance/data-deletion"; Name = "Data Deletion" }
)

foreach ($endpoint in $endpoints) {
    $url = $baseUrl + $endpoint.Path
    Write-Host "Testing $($endpoint.Name)..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($endpoint.Name) - OK ($($response.StatusCode))" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $($endpoint.Name) - Status: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ $($endpoint.Name) - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "📋 URLs for Facebook App Settings:" -ForegroundColor Cyan
Write-Host "   Privacy Policy: $baseUrl/api/compliance/privacy-policy" -ForegroundColor White
Write-Host "   Terms of Service: $baseUrl/api/compliance/terms" -ForegroundColor White
Write-Host "   Data Deletion: $baseUrl/api/compliance/data-deletion" -ForegroundColor White
Write-Host "   Deauthorize: $baseUrl/api/compliance/deauthorize" -ForegroundColor White