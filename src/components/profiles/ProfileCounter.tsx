interface ProfileCounterProps {
  count: number;
}

export default function ProfileCounter({ count }: ProfileCounterProps) {
  return (
    <p className="text-lg font-medium" aria-label={`Utworzone profile: ${count} z 10`}>
      {count}/10 profili
    </p>
  );
}

