/** PropertyCardSkeleton — Loading state matching the full-bleed PropertyCard */
const PropertyCardSkeleton = () => (
  <div className="relative rounded-2xl overflow-hidden h-[340px] sm:h-[380px]
                  ring-1 ring-white/[0.06] bg-dark-800">
    {/* Full background shimmer */}
    <div className="absolute inset-0 skeleton rounded-none" />

    {/* Top badges */}
    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
      <div className="skeleton-text w-20 h-6 rounded-lg !bg-white/10" />
      <div className="skeleton-text w-10 h-6 rounded-lg !bg-white/10" />
    </div>

    {/* Bottom content overlay */}
    <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="skeleton-text w-3/4 h-5 !bg-white/10" />
          <div className="skeleton-text w-1/2 h-3 !bg-white/10" />
          <div className="flex gap-2">
            <div className="skeleton-text w-16 h-3 !bg-white/10" />
            <div className="skeleton-text w-16 h-3 !bg-white/10" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="space-y-1">
            <div className="skeleton-text w-14 h-2 !bg-white/10" />
            <div className="skeleton-text w-24 h-5 !bg-white/10" />
          </div>
          <div className="skeleton w-9 h-9 rounded-xl !bg-white/10" />
        </div>
      </div>
    </div>
  </div>
);

export default PropertyCardSkeleton;
