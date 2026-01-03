import { z } from "zod";

/**
 * Zod schema for common pagination query parameters.
 *
 * Validates:
 * - `page` must be an integer ≥ 1 (default 1)
 * - `pageSize` must be an integer between 1 and 100 (default 20)
 *
 * All parameters are optional because defaults are applied in the service layer
 * if they are omitted. The schema converts numeric strings into numbers.
 */
export const paginationParamsSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val) && val >= 1), {
      message: "page must be an integer greater than or equal to 1",
    }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : Number(val)))
    .refine((val) => val === undefined || (!isNaN(val) && Number.isInteger(val) && val >= 1 && val <= 100), {
      message: "pageSize must be an integer between 1 and 100",
    }),
});

/**
 * Inferred TypeScript type from the Zod schema.
 */
export type PaginationParamsInput = z.infer<typeof paginationParamsSchema>;
