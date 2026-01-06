import { z } from "zod";

/**
 * Schema for validating profileId path parameter
 * Used in task-related endpoints
 */
export const profileIdParamSchema = z.object({
  profileId: z.string().uuid({ message: "Invalid profile ID format" }),
});
