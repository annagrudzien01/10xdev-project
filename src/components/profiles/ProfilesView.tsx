import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";
import ProfileCounter from "./ProfileCounter";
import ProfileList from "./ProfileList";
import EmptyState from "./EmptyState";
import SkeletonProfileCard from "./SkeletonProfileCard";
import { useProfilesQuery } from "@/lib/hooks/useProfilesQuery";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

export default function ProfilesView() {
  const { profiles, count, isLoading } = useProfilesQuery();
  const user = useAuthUser();

  const canAdd = count < 10;

  return (
    <>
      {/* Header with logout/dashboard buttons */}
      <HeaderAuthenticated userEmail={user?.email ?? ""} />

      <main className="flex-1 container mx-auto px-4 py-8 space-y-8">
        {/* Counter */}
        {!isLoading && count > 0 && <ProfileCounter count={count} />}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonProfileCard key={idx} />
            ))}
          </div>
        ) : count === 0 ? (
          <EmptyState />
        ) : (
          <ProfileList profiles={profiles} canAdd={canAdd} />
        )}
      </main>
    </>
  );
}
