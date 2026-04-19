/** PropertyCardSkeleton — Loading state for PropertyCard */
const PropertyCardSkeleton = () => (
  <div className="glass-card overflow-hidden">
    {/* Image skeleton */}
    <div className="skeleton h-48 sm:h-52 rounded-none" />
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <div className="skeleton-text w-3/4" />
      <div className="skeleton-text w-1/2 h-3" />
      <div className="flex gap-3">
        <div className="skeleton-text w-1/4 h-3" />
        <div className="skeleton-text w-1/4 h-3" />
      </div>
      <div className="flex justify-between items-end pt-1">
        <div className="space-y-1">
          <div className="skeleton-text w-16 h-2" />
          <div className="skeleton-text w-24 h-6" />
        </div>
        <div className="skeleton w-9 h-9 rounded-xl" />
      </div>
    </div>
  </div>
);

export default PropertyCardSkeleton;
