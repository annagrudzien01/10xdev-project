import { z } from "zod";

/**
 * Schema for user login
 * Used in POST /api/auth/login endpoint
 */
export const loginSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Podaj prawidłowy adres e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Schema for user registration
 * Used in POST /api/auth/register endpoint
 */
export const registerSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Podaj prawidłowy adres e-mail"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Schema for forgot password request
 * Used in POST /api/auth/forgot-password endpoint
 */
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-mail jest wymagany").email("Podaj prawidłowy adres e-mail"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Schema for password reset
 * Used in POST /api/auth/reset-password endpoint
 */
export const resetPasswordSchema = z.object({
  accessToken: z.string().min(1, "Token dostępu jest wymagany"),
  refreshToken: z.string().min(1, "Token odświeżania jest wymagany"),
  password: z
    .string()
    .min(8, "Hasło musi mieć co najmniej 8 znaków")
    .regex(/[A-Z]/, "Hasło musi zawierać co najmniej jedną wielką literę")
    .regex(/[a-z]/, "Hasło musi zawierać co najmniej jedną małą literę")
    .regex(/[0-9]/, "Hasło musi zawierać co najmniej jedną cyfrę")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Hasło musi zawierać co najmniej jeden znak specjalny"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
