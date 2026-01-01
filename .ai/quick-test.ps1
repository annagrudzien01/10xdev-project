# Quick Test Script for POST /api/profiles (PowerShell)
# Usage: .\quick-test.ps1

Write-Host "🧪 POST /api/profiles - Quick Test Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dev server is running
Write-Host "📍 Checking if dev server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4321" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Dev server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Dev server is not running on port 4321" -ForegroundColor Red
    Write-Host "   Run: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📍 Get JWT Token" -ForegroundColor Yellow
Write-Host ""
Write-Host "To create a test user and get JWT token, run:" -ForegroundColor White
Write-Host ""
Write-Host 'Invoke-RestMethod -Uri "http://127.0.0.1:54321/auth/v1/signup" -Method POST -Headers @{ "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"; "Content-Type" = "application/json" } -Body ''{"email": "test@example.com", "password": "testpassword123"}''' -ForegroundColor Cyan
Write-Host ""
Write-Host "Or login if user exists:" -ForegroundColor White
Write-Host ""
Write-Host 'Invoke-RestMethod -Uri "http://127.0.0.1:54321/auth/v1/token?grant_type=password" -Method POST -Headers @{ "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"; "Content-Type" = "application/json" } -Body ''{"email": "test@example.com", "password": "testpassword123"}''' -ForegroundColor Cyan
Write-Host ""

$JWT_TOKEN = Read-Host "Enter your JWT token (or press Enter to see manual commands)"

if ([string]::IsNullOrWhiteSpace($JWT_TOKEN)) {
    Write-Host ""
    Write-Host "⚠️  No token provided. Manual test commands:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host 'Invoke-RestMethod -Uri "http://localhost:4321/api/profiles" -Method POST -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer YOUR_JWT_TOKEN" } -Body ''{"profileName":"Anna","dateOfBirth":"2018-05-24"}''' -ForegroundColor Cyan
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "🧪 Running tests..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Success
Write-Host "Test 1: Create profile (should succeed - 201)" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4321/api/profiles" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $JWT_TOKEN"
        } `
        -Body '{"profileName":"Anna","dateOfBirth":"2018-05-24"}'
    
    Write-Host "✅ Status: 201 Created" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 2: No auth
Write-Host "Test 2: No authentication (should fail - 401)" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4321/api/profiles" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body '{"profileName":"Jan","dateOfBirth":"2016-03-15"}'
    
    Write-Host "❌ Should have failed with 401" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 10
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ Status: 401 Unauthorized (expected)" -ForegroundColor Green
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Yellow
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 3: Invalid name
Write-Host "Test 3: Invalid profile name (should fail - 400)" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4321/api/profiles" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $JWT_TOKEN"
        } `
        -Body '{"profileName":"Anna123","dateOfBirth":"2018-05-24"}'
    
    Write-Host "❌ Should have failed with 400" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 10
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Status: 400 Bad Request (expected)" -ForegroundColor Green
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Yellow
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

# Test 4: Duplicate
Write-Host "Test 4: Duplicate profile name (should fail - 409)" -ForegroundColor White
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4321/api/profiles" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $JWT_TOKEN"
        } `
        -Body '{"profileName":"Anna","dateOfBirth":"2016-08-10"}'
    
    Write-Host "❌ Should have failed with 409" -ForegroundColor Red
    $response | ConvertTo-Json -Depth 10
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Status: 409 Conflict (expected)" -ForegroundColor Green
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host $responseBody -ForegroundColor Yellow
    } else {
        Write-Host "❌ Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Testing complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Check your database:" -ForegroundColor White
Write-Host "  http://127.0.0.1:54323 (Supabase Studio)" -ForegroundColor Cyan
Write-Host "  Table: child_profiles" -ForegroundColor Cyan

