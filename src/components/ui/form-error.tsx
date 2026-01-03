import * as React from "react";
import { cn } from "@/lib/utils";

export interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  id?: string;
  children: React.ReactNode;
}

/**
 * FormError component for displaying field-level validation errors
 *
 * Uses ARIA live region for screen reader announcements
 * and semantic styling for error states.
 */
const FormError = React.forwardRef<HTMLParagraphElement, FormErrorProps>(({ className, children, ...props }, ref) => {
  if (!children) return null;

  return (
    <p ref={ref} role="alert" aria-live="assertive" className={cn("text-sm text-destructive", className)} {...props}>
      {children}
    </p>
  );
});
FormError.displayName = "FormError";

export { FormError };
