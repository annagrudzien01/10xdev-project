import { z } from "zod";

/**
 * Schema for validating profileId path parameter
 * Used in task-related endpoints
 */
export const profileIdParamSchema = z.object({
  profileId: z.string().uuid({ message: "Invalid profile ID format" }),
});

/**
 * Schema for validating sessionId query parameter
 * Used in task-related endpoints that require session tracking
 */
export const sessionIdQuerySchema = z.object({
  sessionId: z.string().uuid({ message: "Invalid session ID format" }),
});
