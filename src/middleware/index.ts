import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Astro middleware for Supabase authentication and security headers
 *
 * Extracts JWT token from Authorization header and creates a Supabase client
 * with the user's session. This allows RLS policies to work correctly.
 *
 * Also adds security headers to all responses for enhanced protection against
 * common web vulnerabilities (XSS, clickjacking, MIME sniffing, etc.)
 *
 * If no token is provided, supabase client is still created but without user context.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Extract JWT from Authorization header
  const authHeader = context.request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  // Create Supabase client with token (if present)
  if (token) {
    // Create client with user's JWT for RLS
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    context.locals.supabase = supabase;
  } else {
    // Create anonymous client (API routes will handle 401 if needed)
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    context.locals.supabase = supabase;
  }

  // Process the request
  const response = await next();

  // Add security headers to all responses
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  );

  return response;
});
