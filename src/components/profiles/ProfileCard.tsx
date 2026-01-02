import { cn } from "@/lib/utils";
import { useCallback } from "react";

export interface ProfileCardProps {
  profile: {
    id: string;
    displayName: string;
    age: number;
    level: number;
  };
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  const handleClick = useCallback(() => {
    window.location.href = `/game/start?profileId=${profile.id}`;
  }, [profile.id]);

  return (
    <button
      onClick={handleClick}
      className={cn(
        "bg-card rounded-lg border shadow-sm p-4 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-0.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      )}
      role="listitem"
    >
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-4">
        {profile.displayName.charAt(0).toUpperCase()}
      </div>
      {/* Name */}
      <h3 className="font-semibold text-lg">{profile.displayName}</h3>
      {/* Age + Level */}
      <p className="text-sm text-muted-foreground">
        {profile.age} lat • poziom {profile.level}
      </p>
    </button>
  );
}

