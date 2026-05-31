import React from 'react';

const CheckoutPropertySummary = ({ property, unit }) => {
  return (
    <div className="glass-card p-5 flex gap-4">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white">
        {property.mainImage ? (
          <img src={property.mainImage} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-gray-900 font-bold text-lg truncate">{property.title}</h3>
        <p className="text-gray-500 text-xs mt-0.5">📍 {property.address}, {property.city}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs px-2 py-1 rounded-lg bg-primary-500/15 border border-primary-500/30 text-primary-600 capitalize">
            {property.category}
          </span>
          {unit.unitNumber && (
            <span className="text-xs text-gray-500">Unit: {unit.unitNumber}</span>
          )}
          {unit.floor && (
            <span className="text-xs text-gray-500">Floor: {unit.floor}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPropertySummary;
