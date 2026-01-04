import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

/**
 * Protected paths that require authentication
 * Users without valid session will be redirected to /login
 */
const PROTECTED_PATHS = ["/profiles", "/game"];

/**
 * Public authentication paths that should redirect to /profiles if user is already logged in
 */
const PUBLIC_AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

/**
 * Astro middleware for Supabase authentication and security headers
 *
 * Features:
 * - Extracts JWT token from Authorization header OR cookies
 * - Creates Supabase client with user's session for RLS policies
 * - Protects routes requiring authentication (auto-redirect to /login)
 * - Redirects authenticated users away from auth pages (to /profiles)
 * - Adds security headers to all responses
 *
 * If no token is provided, supabase client is still created but without user context.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect } = context;

  // Extract JWT from Authorization header OR cookie
  const authHeader = context.request.headers.get("Authorization");
  let token = authHeader?.replace("Bearer ", "");

  // If no Authorization header, check cookies
  if (!token) {
    const accessTokenCookie = cookies.get("sb-access-token");
    token = accessTokenCookie?.value;
  }

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

    // For protected paths, verify the token is still valid
    if (PROTECTED_PATHS.some((path) => url.pathname.startsWith(path))) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        // Token is invalid or expired - clear cookies and redirect to login
        cookies.delete("sb-access-token", { path: "/" });
        cookies.delete("sb-refresh-token", { path: "/" });
        return redirect("/login");
      }

      // Set user in locals for API routes
      context.locals.user = user;
    }

    // If user is authenticated and trying to access auth pages, redirect to profiles
    if (PUBLIC_AUTH_PATHS.includes(url.pathname)) {
      return redirect("/profiles");
    }
  } else {
    // Create anonymous client (API routes will handle 401 if needed)
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    context.locals.supabase = supabase;

    // If trying to access protected path without token, redirect to login
    if (PROTECTED_PATHS.some((path) => url.pathname.startsWith(path))) {
      return redirect("/login");
    }
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
