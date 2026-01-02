import ProfileCard from "./ProfileCard";
import AddProfileCard from "./AddProfileCard";
import type { ProfileVM } from "@/lib/hooks/useProfilesQuery";

interface ProfileListProps {
  profiles: ProfileVM[];
  canAdd: boolean;
}

export default function ProfileList({ profiles, canAdd }: ProfileListProps) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" role="list">
      {profiles.map((p) => (
        <li key={p.id}>
          <ProfileCard profile={p} />
        </li>
      ))}
      {canAdd && (
        <li>
          <AddProfileCard disabled={!canAdd} />
        </li>
      )}
    </ul>
  );
}

