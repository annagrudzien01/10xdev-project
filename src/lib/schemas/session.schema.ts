import { z } from "zod";
import { paginationParamsSchema } from "./pagination.schema";

/**
 * Schema for validating profileId path parameter
 * Reused from task.schema.ts for consistency
 */
export const profileIdParamSchema = z.object({
  profileId: z.string().uuid({ message: "Invalid profile ID format" }),
});

/**
 * Schema for validating sessionId path parameter
 */
export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid({ message: "Invalid session ID format" }),
});

/**
 * Schema for validating session list query parameters
 * Extends pagination schema with optional active filter
 */
export const sessionListParamsSchema = paginationParamsSchema.extend({
  active: z
    .string()
    .optional()
    .refine((val) => val === undefined || val === "true" || val === "false", "active must be 'true' or 'false'")
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
});

/**
 * Inferred TypeScript types from Zod schemas
 */
export type ProfileIdParams = z.infer<typeof profileIdParamSchema>;
export type SessionIdParams = z.infer<typeof sessionIdParamSchema>;
export type SessionListParams = z.infer<typeof sessionListParamsSchema>;
