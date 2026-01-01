import { z } from "zod";

/**
 * Zod schema for creating a child profile
 *
 * Validates:
 * - profileName: 1-32 characters, only letters (Latin + Polish), spaces, and hyphens
 * - dateOfBirth: Must be a valid date in the past, child must be 2-18 years old
 */
export const createChildProfileSchema = z.object({
  profileName: z
    .string()
    .min(1, "Profile name is required")
    .max(32, "Profile name must not exceed 32 characters")
    .regex(/^[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż\- ]+$/, "Profile name must contain only letters, spaces, and hyphens"),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Invalid date format")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      return date < today;
    }, "Date of birth must be in the past")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();

      // Adjust age if birthday hasn't occurred this year yet
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      return actualAge >= 2 && actualAge <= 18;
    }, "Child must be between 2 and 18 years old"),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type CreateChildProfileInput = z.infer<typeof createChildProfileSchema>;
