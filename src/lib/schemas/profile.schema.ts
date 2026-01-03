import { z } from "zod";

/**
 * Zod schema for creating a child profile
 *
 * Validates:
 * - profileName: 2-50 characters, only letters (Latin + Polish), spaces, and hyphens
 * - dateOfBirth: Must be a valid date in the past, child must be 3-18 years old
 */
export const createChildProfileSchema = z.object({
  profileName: z
    .string()
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(50, "Imię nie może przekraczać 50 znaków")
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, "Imię może zawierać tylko litery, spacje i myślniki"),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Nieprawidłowy format daty")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      return date < today;
    }, "Data urodzenia musi być w przeszłości")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();

      // Adjust age if birthday hasn't occurred this year yet
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      return actualAge >= 3 && actualAge <= 18;
    }, "Dziecko musi mieć od 3 do 18 lat"),
});

/**
 * Inferred TypeScript type from the Zod schema
 */
export type CreateChildProfileInput = z.infer<typeof createChildProfileSchema>;

/**
 * Zod schema for updating a child profile
 *
 * Same validation rules as create, but all fields are optional for partial updates
 */
export const updateChildProfileSchema = z.object({
  profileName: z
    .string()
    .min(2, "Imię musi mieć co najmniej 2 znaki")
    .max(50, "Imię nie może przekraczać 50 znaków")
    .regex(/^[a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ\s-]+$/, "Imię może zawierać tylko litery, spacje i myślniki")
    .optional(),
  dateOfBirth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, "Nieprawidłowy format daty")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      return date < today;
    }, "Data urodzenia musi być w przeszłości")
    .refine((val) => {
      const date = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();

      // Adjust age if birthday hasn't occurred this year yet
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      return actualAge >= 3 && actualAge <= 18;
    }, "Dziecko musi mieć od 3 do 18 lat")
    .optional(),
});

/**
 * Inferred TypeScript type from the update schema
 */
export type UpdateChildProfileInput = z.infer<typeof updateChildProfileSchema>;

/**
 * Form values type used in both create and edit modes
 */
export interface ProfileFormValues {
  profileName: string;
  dateOfBirth: string;
}
