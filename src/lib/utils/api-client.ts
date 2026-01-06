/**
 * API Client Utilities
 *
 * Provides helper functions for making API requests with automatic
 * error handling and authentication redirect on 401 responses.
 */

/**
 * Custom fetch wrapper that handles 401 errors by redirecting to login
 *
 * @param input - Request URL or Request object
 * @param init - Fetch options
 * @returns Response object
 *
 * @example
 * ```typescript
 * const response = await fetchWithAuth('/api/profiles', {
 *   method: 'GET',
 * });
 * ```
 */
export async function fetchWithAuth(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const response = await fetch(input, init);

    // If 401 Unauthorized, check if we should redirect
    if (response.status === 401) {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

      // Don't redirect on auth endpoints (login, register, etc.)
      const isAuthEndpoint =
        url.includes("/api/auth/login") ||
        url.includes("/api/auth/register") ||
        url.includes("/api/auth/forgot-password") ||
        url.includes("/api/auth/reset-password");

      if (!isAuthEndpoint) {
        handleUnauthorized();
      }
      // Return the response anyway for components that might want to handle it
      return response;
    }

    return response;
  } catch (error) {
    // Network errors or other fetch failures
    throw error;
  }
}

/**
 * Handles unauthorized (401) responses by:
 * 1. Clearing auth cookies
 * 2. Redirecting to login page with return URL
 */
export function handleUnauthorized(): void {
  // Clear authentication cookies
  document.cookie = "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

  // Get current path for redirect after login
  const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);

  // Redirect to login with return URL
  window.location.href = `/login?returnUrl=${returnUrl}`;
}

/**
 * API client with automatic JSON parsing and error handling
 *
 * @param url - API endpoint URL
 * @param options - Request options (method, body, headers, etc.)
 * @returns Parsed JSON response
 * @throws Error with API error message
 *
 * @example
 * ```typescript
 * try {
 *   const profile = await apiClient<ChildProfileDTO>('/api/profiles/123', {
 *     method: 'GET',
 *   });
 * } catch (error) {
 *   console.error('API error:', error.message);
 * }
 * ```
 */
export async function apiClient<T>(
  url: string,
  options: RequestInit & { skipAuthRedirect?: boolean } = {}
): Promise<T> {
  const { skipAuthRedirect, ...fetchOptions } = options;

  // Set default headers
  const headers = new Headers(fetchOptions.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Use fetchWithAuth or regular fetch based on skipAuthRedirect flag
  const fetchFn = skipAuthRedirect ? fetch : fetchWithAuth;
  const response = await fetchFn(url, {
    ...fetchOptions,
    headers,
  });

  // Parse response body
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || "Request failed");
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  }

  // Return parsed JSON
  if (isJson) {
    return response.json();
  }

  // For non-JSON responses, return empty object
  return {} as T;
}

/**
 * Type guard to check if error is an API error with message
 */
export function isAPIError(error: unknown): error is { message: string; error: string } {
  return typeof error === "object" && error !== null && ("message" in error || "error" in error);
}
