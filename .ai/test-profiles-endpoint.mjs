#!/usr/bin/env node

/**
 * Quick test script for POST /api/profiles endpoint
 *
 * Usage:
 *   node test-profiles-endpoint.mjs YOUR_JWT_TOKEN
 *
 * Or with environment variable:
 *   JWT_TOKEN=your_token node test-profiles-endpoint.mjs
 */

const API_URL = process.env.API_URL || "http://localhost:4321/api/profiles";
const JWT_TOKEN = process.argv[2] || process.env.JWT_TOKEN;

if (!JWT_TOKEN) {
  console.error("❌ Error: JWT token required");
  console.error("Usage: node test-profiles-endpoint.mjs YOUR_JWT_TOKEN");
  console.error("   or: JWT_TOKEN=your_token node test-profiles-endpoint.mjs");
  process.exit(1);
}

// Test cases
const tests = [
  {
    name: "✅ Valid profile creation",
    data: {
      profileName: "Anna",
      dateOfBirth: "2018-05-24",
    },
    auth: true,
    expectedStatus: 201,
  },
  {
    name: "❌ No authentication",
    data: {
      profileName: "Jan",
      dateOfBirth: "2016-03-15",
    },
    auth: false,
    expectedStatus: 401,
  },
  {
    name: "❌ Invalid name with numbers",
    data: {
      profileName: "Anna123",
      dateOfBirth: "2018-05-24",
    },
    auth: true,
    expectedStatus: 400,
  },
  {
    name: "❌ Future date of birth",
    data: {
      profileName: "Future Baby",
      dateOfBirth: "2030-01-01",
    },
    auth: true,
    expectedStatus: 400,
  },
  {
    name: "❌ Child too young",
    data: {
      profileName: "Baby",
      dateOfBirth: "2024-01-01",
    },
    auth: true,
    expectedStatus: 400,
  },
  {
    name: "✅ Polish characters",
    data: {
      profileName: "Łukasz Żółkowski",
      dateOfBirth: "2015-11-20",
    },
    auth: true,
    expectedStatus: 201,
  },
  {
    name: "✅ Hyphenated name",
    data: {
      profileName: "Anna-Maria",
      dateOfBirth: "2017-06-15",
    },
    auth: true,
    expectedStatus: 201,
  },
  {
    name: "❌ Name too long",
    data: {
      profileName: "Anna Maria Katarzyna Joanna Aleksandra Smith Johnson",
      dateOfBirth: "2018-05-24",
    },
    auth: true,
    expectedStatus: 400,
  },
];

// Run tests
async function runTests() {
  console.log("🧪 Testing POST /api/profiles endpoint\n");
  console.log(`📍 API URL: ${API_URL}`);
  console.log(`🔑 JWT Token: ${JWT_TOKEN.substring(0, 20)}...\n`);

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (test.auth) {
        headers["Authorization"] = `Bearer ${JWT_TOKEN}`;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(test.data),
      });

      const data = await response.json();
      const status = response.status;

      // Check security headers
      const securityHeaders = {
        "strict-transport-security": response.headers.get("strict-transport-security"),
        "x-content-type-options": response.headers.get("x-content-type-options"),
        "x-frame-options": response.headers.get("x-frame-options"),
        "x-xss-protection": response.headers.get("x-xss-protection"),
      };

      if (status === test.expectedStatus) {
        console.log(`✅ ${test.name}`);
        console.log(`   Status: ${status}`);
        console.log(
          `   Response:`,
          JSON.stringify(data, null, 2)
            .split("\n")
            .map((l) => "   " + l)
            .join("\n")
        );

        // Verify security headers
        const missingHeaders = Object.entries(securityHeaders)
          .filter(([_, value]) => !value)
          .map(([key, _]) => key);

        if (missingHeaders.length > 0) {
          console.log(`   ⚠️  Missing security headers: ${missingHeaders.join(", ")}`);
        }

        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        console.log(`   Expected: ${test.expectedStatus}, Got: ${status}`);
        console.log(
          `   Response:`,
          JSON.stringify(data, null, 2)
            .split("\n")
            .map((l) => "   " + l)
            .join("\n")
        );
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
    }
    console.log("");
  }

  console.log("═".repeat(60));
  console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`);
  console.log("═".repeat(60));

  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("⚠️  Some tests failed. Please review the output above.");
  }
}

// Run
runTests().catch(console.error);
