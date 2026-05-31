import React from 'react';

const PropertySidebar = ({
  cat,
  price,
  villaDetails,
  landDetails,
  unitData,
  companyId,
  setActiveTab,
  setSelectedUnit,
}) => {
  return (
    <div className="space-y-4">
      {/* Price card */}
      <div className="glass-card p-5 sticky top-20">
        <p className="text-gray-500 text-xs mb-1">Total Price</p>
        <p className="text-3xl font-black text-gray-900 mb-1">
          {cat === 'villa' && villaDetails?.totalPrice
            ? `৳${villaDetails.totalPrice.toLocaleString()}`
            : cat === 'land' && landDetails?.totalPrice
              ? `৳${landDetails.totalPrice.toLocaleString()}`
              : `৳${(price || 0).toLocaleString()}`}
        </p>
        {cat === 'apartment' && <p className="text-gray-500 text-xs mb-5">per unit (varies by type)</p>}
        {cat !== 'apartment' && <div className="mb-5" />}

        <button
          onClick={() => setActiveTab('Floor Plan')}
          className={`${cat === 'apartment' ? 'btn-primary' : 'btn-secondary'} w-full mb-3`}
        >
          {cat === 'apartment' ? '🏗️ View Floor Plan' : cat === 'villa' ? '🏡 View Villa Preview' : '🌿 View Land Preview'}
        </button>

        {cat === 'apartment' ? (
          <p className="text-center text-gray-500 text-xs">
            Click a unit in the floor plan to book
          </p>
        ) : (
          <button
            onClick={() => {
              if (unitData.units && unitData.units.length > 0) {
                setSelectedUnit(unitData.units[0]);
              }
            }}
            className="btn-primary w-full"
          >
            📋 Request Booking
          </button>
        )}
      </div>

      {/* Company card */}
      {companyId && (
        <div className="glass-card p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Listed by</p>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/30
                            to-primary-800/30 border border-primary-500/20 flex items-center
                            justify-center flex-shrink-0 text-lg">
              🏢
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 font-semibold text-sm truncate">{companyId.name}</p>
              {companyId.email && (
                <p className="text-gray-500 text-xs truncate">{companyId.email}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertySidebar;
