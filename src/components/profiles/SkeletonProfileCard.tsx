export default function SkeletonProfileCard() {
  return (
    <div className="animate-pulse bg-muted/50 rounded-lg p-4" role="status" aria-busy="true">
      <div className="w-20 h-20 rounded-full bg-muted mb-4 mx-auto" />
      <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2" />
      <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
    </div>
  );
}
