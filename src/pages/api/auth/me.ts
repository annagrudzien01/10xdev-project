import type { APIRoute } from "astro";
import { UnauthorizedError } from "../../../lib/errors/api-errors";
import type { APIErrorResponse, AuthUserDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/auth/me - Get current authenticated user
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    if (!supabase) {
      throw new UnauthorizedError();
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new UnauthorizedError();
    }

    // Return minimal user info
    const response: AuthUserDTO = {
      id: user.id,
      email: user.email ?? "",
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return new Response(
        JSON.stringify({
          error: "unauthenticated",
          message: error.message,
        } as APIErrorResponse),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
