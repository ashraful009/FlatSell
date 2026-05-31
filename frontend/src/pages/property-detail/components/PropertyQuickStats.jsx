import React from 'react';

const PropertyQuickStats = ({
  cat,
  villaDetails,
  landDetails,
  totalFloors,
  unitsPerFloor,
  unitData,
}) => {
  const statsList = cat === 'villa' ? [
    { label: 'Floors',   value: villaDetails?.totalFloors || '—' },
    { label: 'Bedrooms', value: villaDetails?.bedrooms   || '—' },
    { label: 'Bathrooms',value: villaDetails?.bathrooms  || '—' },
    { label: 'Land Size',value: villaDetails?.totalLandSize ? `${villaDetails.totalLandSize} Katha` : '—' },
  ] : cat === 'land' ? [
    { label: 'Size',     value: landDetails?.totalSize ? `${landDetails.totalSize} Katha` : '—' },
    { label: 'Shape',    value: landDetails?.plotShape  || '—' },
    { label: 'Type',     value: landDetails?.landType   || '—' },
    { label: 'Road',     value: landDetails?.roadAccess || '—' },
  ] : [
    { label: 'Floors',       value: totalFloors   },
    { label: 'Units/Floor',  value: unitsPerFloor },
    { label: 'Total Units',  value: unitData.stats?.total || ((totalFloors || 0) * (unitsPerFloor || 0)) },
    { label: 'Available',    value: unitData.stats?.available ?? '—' },
  ];

  return (
    <div className="flex flex-wrap gap-4 mb-6 text-sm">
      {statsList.map(({ label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center px-4 py-2.5 bg-slate-50 border border-blue-100 rounded-xl"
        >
          <span className="text-lg font-bold text-gray-900">{value}</span>
          <span className="text-gray-500 text-xs">{label}</span>
        </div>
      ))}
    </div>
  );
};

export default PropertyQuickStats;
