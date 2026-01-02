import HeaderAuthenticated from "@/components/auth/HeaderAuthenticated";

export default function ProfilesView() {
  return (
    <>
      <HeaderAuthenticated userEmail="" />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-8"></main>
    </>
  );
}
