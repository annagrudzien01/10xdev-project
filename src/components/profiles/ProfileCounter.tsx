export interface ProfileCounterProps {
  count: number;
}

/**
 * ProfileCounter - Displays the current profile count out of maximum (10)
 *
 * Shows a simple counter in format "X/10 profili" with proper ARIA label
 * for screen readers.
 */
export default function ProfileCounter({ count }: ProfileCounterProps) {
  return (
    <p className="text-lg font-medium" aria-label={`Utworzone profile: ${count} z 10`}>
      {count}/10 profili
    </p>
  );
}
