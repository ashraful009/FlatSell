import React from 'react';

const PropertyAboutTab = ({
  cat,
  description,
  villaDetails,
  landDetails,
}) => {
  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h2 className="text-gray-900 font-semibold mb-3">About this Property</h2>
        <p className="text-gray-500 leading-relaxed text-sm whitespace-pre-line">
          {description}
        </p>
      </div>

      {/* Villa-specific details */}
      {cat === 'villa' && villaDetails && (
        <>
          <div>
            <h3 className="text-gray-900 font-semibold mb-3 text-sm">Construction Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Year',        v: villaDetails.constructionYear || '—' },
                { l: 'Developer',   v: villaDetails.developerName    || '—' },
                { l: 'Materials',   v: villaDetails.materialsQuality || '—' },
                { l: 'Earthquake',  v: villaDetails.earthquakeResistant || '—' },
              ].map(({ l, v }) => (
                <div key={l} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <p className="text-gray-900 text-sm">{v}</p>
                  <p className="text-gray-500 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-3 text-sm">Features & Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {[
                ['privatePool',    '🏊 Pool'],
                ['garden',         '🌳 Garden'],
                ['garage',         '🚗 Garage'],
                ['rooftopTerrace', '🌇 Rooftop'],
                ['servantRoom',    '🛏️ Servant Room'],
                ['securitySystem', '🔒 Security'],
              ].map(([key, label]) => (
                <span
                  key={key}
                  className={`text-xs px-3 py-1.5 rounded-lg border ${
                    villaDetails[key] === 'Yes'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-50 border-blue-100 text-gray-500'
                  }`}
                >
                  {label}: {villaDetails[key] || 'No'}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Land-specific details */}
      {cat === 'land' && landDetails && (
        <>
          <div>
            <h3 className="text-gray-900 font-semibold mb-3 text-sm">Legal Information</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: 'Khatian',     v: landDetails.khatianNumber  || '—' },
                { l: 'Dag',         v: landDetails.dagNumber      || '—' },
                { l: 'Ownership',   v: landDetails.landOwnership  || '—' },
                { l: 'Dispute',     v: landDetails.anyDispute     || '—' },
              ].map(({ l, v }) => (
                <div key={l} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  <p className="text-gray-900 text-sm">{v}</p>
                  <p className="text-gray-500 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-gray-900 font-semibold mb-3 text-sm">Utilities</h3>
            <div className="flex flex-wrap gap-2">
              {[
                ['electricityLine',    '⚡ Electricity'],
                ['gasWaterConnection',  '💧 Gas/Water'],
                ['drainageSystem',      '🚰 Drainage'],
              ].map(([key, label]) => (
                <span
                  key={key}
                  className={`text-xs px-3 py-1.5 rounded-lg border ${
                    landDetails[key] === 'Yes'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-50 border-blue-100 text-gray-500'
                  }`}
                >
                  {label}: {landDetails[key] || 'No'}
                </span>
              ))}
            </div>
          </div>
          {(landDetails.nearbySchool || landDetails.nearbyHospital || landDetails.nearbyMarket) && (
            <div>
              <h3 className="text-gray-900 font-semibold mb-3 text-sm">Nearby Facilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { l: '🏫 School',   v: landDetails.nearbySchool },
                  { l: '🏥 Hospital', v: landDetails.nearbyHospital },
                  { l: '🏪 Market',   v: landDetails.nearbyMarket },
                ].filter(({ v }) => v).map(({ l, v }) => (
                  <div key={l} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                    <p className="text-gray-500 text-xs mb-0.5">{l}</p>
                    <p className="text-gray-900 text-sm">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PropertyAboutTab;
