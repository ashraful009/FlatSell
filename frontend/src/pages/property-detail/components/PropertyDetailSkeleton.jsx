import React from 'react';

const PropertyDetailSkeleton = () => (
  <div className="container-main py-8 animate-pulse">
    <div className="skeleton h-72 sm:h-96 rounded-2xl mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="skeleton-text w-2/3 h-8" />
        <div className="skeleton-text w-1/3 h-4" />
        <div className="skeleton-text w-full" />
        <div className="skeleton-text w-5/6" />
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  </div>
);

export default PropertyDetailSkeleton;
