import * as React from "react";
import { cn } from "@/lib/utils";

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  min?: string;
  max?: string;
}

/**
 * DatePicker component using native HTML5 date input
 *
 * Provides accessible date selection with min/max constraints
 * and error state styling.
 */
const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, error, min, max, ...props }, ref) => {
    return (
      <input
        type="date"
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        ref={ref}
        min={min}
        max={max}
        {...props}
      />
    );
  }
);
DatePicker.displayName = "DatePicker";

export { DatePicker };
