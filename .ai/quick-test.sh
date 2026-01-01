#!/bin/bash

# Quick Test Script for POST /api/profiles
# This script helps you test the endpoint quickly

echo "🧪 POST /api/profiles - Quick Test Script"
echo "=========================================="
echo ""

# Check if Supabase is running
echo "📍 Step 1: Checking if Supabase is running..."
if command -v npx &> /dev/null; then
    npx supabase status > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ Supabase is running"
    else
        echo "❌ Supabase is not running"
        echo "   Run: npx supabase start"
        exit 1
    fi
else
    echo "⚠️  Cannot check Supabase status (npx not found)"
fi

echo ""
echo "📍 Step 2: Get JWT Token"
echo "Run this command to create a test user and get a JWT token:"
echo ""
echo "curl -X POST 'http://127.0.0.1:54321/auth/v1/signup' \\"
echo "  -H \"apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"test@example.com\", \"password\": \"testpassword123\"}'"
echo ""
echo "Or login if user already exists:"
echo ""
echo "curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \\"
echo "  -H \"apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"email\": \"test@example.com\", \"password\": \"testpassword123\"}'"
echo ""
echo "📍 Step 3: Test the endpoint"
echo ""
read -p "Enter your JWT token (or press Enter to skip): " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "⚠️  No token provided. You can test manually with:"
    echo ""
    echo "curl -X POST http://localhost:4321/api/profiles \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN\" \\"
    echo "  -d '{\"profileName\":\"Anna\",\"dateOfBirth\":\"2018-05-24\"}'"
    echo ""
    exit 0
fi

echo ""
echo "🧪 Testing POST /api/profiles..."
echo ""

# Test 1: Success
echo "Test 1: Create profile (should succeed - 201)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"profileName":"Anna","dateOfBirth":"2018-05-24"}' | jq '.' 2>/dev/null || cat

echo ""
echo "----------------------------------------"
echo ""

# Test 2: No auth
echo "Test 2: No authentication (should fail - 401)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -d '{"profileName":"Jan","dateOfBirth":"2016-03-15"}' | jq '.' 2>/dev/null || cat

echo ""
echo "----------------------------------------"
echo ""

# Test 3: Invalid name
echo "Test 3: Invalid profile name (should fail - 400)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"profileName":"Anna123","dateOfBirth":"2018-05-24"}' | jq '.' 2>/dev/null || cat

echo ""
echo "----------------------------------------"
echo ""

# Test 4: Duplicate
echo "Test 4: Duplicate profile name (should fail - 409)"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST http://localhost:4321/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"profileName":"Anna","dateOfBirth":"2016-08-10"}' | jq '.' 2>/dev/null || cat

echo ""
echo "=========================================="
echo "✅ Testing complete!"
echo ""
echo "Check your database:"
echo "  http://127.0.0.1:54323 (Supabase Studio)"
echo "  Table: child_profiles"

