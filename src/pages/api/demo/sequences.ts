/**
 * GET /api/demo/sequences?levelId={levelId}
 *
 * Public endpoint for fetching sequences for demo mode.
 * Returns sequences for levels 1-3 without authentication.
 */

import type { APIRoute } from "astro";
import type { APIErrorResponse } from "@/types";
import { z } from "zod";

export const prerender = false;

const querySchema = z.object({
  levelId: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val || val === "null") return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    })
    .refine((val) => val === undefined || (Number.isInteger(val) && val >= 1 && val <= 3), {
      message: "Level ID must be an integer between 1 and 3",
    })
    .describe("Level ID (1-3). If omitted, returns all sequences for levels 1-3"),
});

interface DemoSequenceDTO {
  id: string;
  levelId: number;
  sequenceBeginning: string;
  sequenceEnd: string;
}

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Parse query parameters
    const levelId = url.searchParams.get("levelId") || undefined;
    const validationResult = querySchema.safeParse({ levelId });

    if (!validationResult.success) {
      const details: Record<string, string> = {};
      validationResult.error.errors.forEach((err) => {
        const field = err.path.join(".");
        details[field] = err.message;
      });

      return new Response(
        JSON.stringify({
          error: "invalid_request",
          message: "Invalid query parameters",
          details,
        } as APIErrorResponse),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { levelId: requestedLevelId } = validationResult.data;

    // Step 2: Get Supabase client (anonymous - no auth required)
    const supabase = locals.supabase;
    if (!supabase) {
      return new Response(
        JSON.stringify({
          error: "internal_error",
          message: "Database connection unavailable",
        } as APIErrorResponse),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 3: Fetch sequences from database
    // If levelId is provided, fetch only that level; otherwise fetch levels 1-3
    let query = supabase.from("sequence").select("id, level_id, sequence_beginning, sequence_end");

    if (requestedLevelId !== undefined) {
      console.log(`Fetching sequences for level ${requestedLevelId}...`);
      query = query.eq("level_id", requestedLevelId);
    } else {
      console.log("Fetching sequences for levels 1-3...");
      query = query.in("level_id", [1, 2, 3]);
    }

    const { data: sequences, error: sequencesError } = await query;

    console.log("Sequences query result:", { sequences, error: sequencesError });

    if (sequencesError) {
      console.error("Error fetching demo sequences:", sequencesError);
      return new Response(
        JSON.stringify({
          error: "database_error",
          message: "Failed to fetch sequences",
          details: import.meta.env.DEV ? sequencesError : undefined,
        } as APIErrorResponse),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!sequences || sequences.length === 0) {
      console.log("No sequences found - returning 404");
      const levelMsg = requestedLevelId ? `level ${requestedLevelId}` : "levels 1-3";
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: `No sequences found for demo (${levelMsg}). Please run database migrations.`,
        } as APIErrorResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${sequences.length} sequences, returning...`);

    // Step 4: Transform to DTO
    const response: DemoSequenceDTO[] = sequences.map((seq) => ({
      id: seq.id,
      levelId: seq.level_id,
      sequenceBeginning: seq.sequence_beginning,
      sequenceEnd: seq.sequence_end,
    }));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Cache for 5 minutes (sequences rarely change)
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/demo/sequences:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred",
        ...(import.meta.env.DEV && {
          details: error instanceof Error ? error.message : String(error),
        }),
      } as APIErrorResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
