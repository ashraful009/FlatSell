import { useState } from 'react';

const STATUS_CONFIG = {
  available: {
    bg:    'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-400',
    text:  'text-emerald-400',
    dot:   'bg-emerald-400',
    label: 'Available',
  },
  booked: {
    bg:    'bg-amber-500/20 border-amber-500/50 hover:bg-amber-500/30 hover:border-amber-400',
    text:  'text-amber-400',
    dot:   'bg-amber-400',
    label: 'Booked',
  },
  sold: {
    bg:    'bg-red-500/20 border-red-500/40 cursor-not-allowed',
    text:  'text-red-400',
    dot:   'bg-red-400',
    label: 'Sold',
  },
};

const FILTERS = ['all', 'available', 'booked', 'sold'];

// ── Villa Amenity Config ──────────────────────────────────────────────────────
const VILLA_AMENITIES = [
  { key: 'privatePool',    label: 'Swimming Pool', icon: '🏊', color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30' },
  { key: 'garden',         label: 'Garden',        icon: '🌳', color: 'from-green-500/20 to-green-600/10 border-green-500/30' },
  { key: 'garage',         label: 'Garage',        icon: '🚗', color: 'from-slate-500/20 to-slate-600/10 border-slate-500/30' },
  { key: 'rooftopTerrace', label: 'Rooftop',       icon: '🌇', color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30' },
  { key: 'servantRoom',    label: 'Servant Room',  icon: '🛏️', color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30' },
  { key: 'securitySystem', label: 'Security',      icon: '🔒', color: 'from-red-500/20 to-red-600/10 border-red-500/30' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Villa Duplex Visualizer
// ═══════════════════════════════════════════════════════════════════════════════
const VillaVisualizer = ({ property }) => {
  const v = property?.villaDetails || {};
  const activeAmenities = VILLA_AMENITIES.filter((a) => v[a.key] === 'Yes');
  const floorCount = Number(v.totalFloors) || 2;

  return (
    <div className="space-y-6">
      {/* Duplex House SVG Visualizer */}
      <div className="bg-dark-800/40 border border-white/8 rounded-2xl p-6 overflow-hidden">
        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-primary-400 rounded-full inline-block" />
          Villa Duplex Preview — <strong className="text-white">{floorCount} Floor{floorCount > 1 ? 's' : ''}</strong>
        </p>

        <div className="flex justify-center">
          <div className="relative w-72 sm:w-80">
            {/* Roof */}
            <div className="flex justify-center mb-0">
              <div className="w-0 h-0 border-l-[160px] sm:border-l-[180px] border-r-[160px] sm:border-r-[180px] border-b-[60px]
                              border-l-transparent border-r-transparent border-b-amber-700/40
                              relative">
                {v.rooftopTerrace === 'Yes' && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-orange-500/20
                                  border border-orange-500/30 rounded px-2 py-0.5 text-orange-300 whitespace-nowrap">
                    🌇 Rooftop
                  </div>
                )}
              </div>
            </div>

            {/* Floors */}
            <div className="flex flex-col">
              {Array.from({ length: Math.min(floorCount, 4) }).map((_, fi) => {
                const isTop = fi === 0;
                const isBottom = fi === Math.min(floorCount, 4) - 1;
                return (
                  <div key={fi}
                    className={`border-x-2 border-b-2 ${isTop ? 'border-t-2' : ''} border-white/15
                                bg-dark-700/60 px-4 py-3 flex items-center justify-between gap-2`}>
                    <span className="text-xs text-gray-500 w-8 flex-shrink-0">F{floorCount - fi}</span>
                    <div className="flex gap-2 flex-wrap justify-center flex-1">
                      {/* Bedrooms */}
                      {Number(v.bedrooms) > 0 && fi === 0 && (
                        <span className="text-xs bg-indigo-500/15 border border-indigo-500/25 rounded px-2 py-0.5 text-indigo-300">
                          🛏️ {v.bedrooms} Bed
                        </span>
                      )}
                      {/* Bathrooms */}
                      {Number(v.bathrooms) > 0 && fi === 0 && (
                        <span className="text-xs bg-blue-500/15 border border-blue-500/25 rounded px-2 py-0.5 text-blue-300">
                          🚿 {v.bathrooms} Bath
                        </span>
                      )}
                      {/* Living */}
                      {v.living === 'Yes' && fi === (floorCount > 1 ? 1 : 0) && (
                        <span className="text-xs bg-teal-500/15 border border-teal-500/25 rounded px-2 py-0.5 text-teal-300">
                          🛋️ Living
                        </span>
                      )}
                      {/* Kitchen & Dining on ground floor */}
                      {v.kitchen === 'Yes' && isBottom && (
                        <span className="text-xs bg-yellow-500/15 border border-yellow-500/25 rounded px-2 py-0.5 text-yellow-300">
                          🍳 Kitchen
                        </span>
                      )}
                      {v.dining === 'Yes' && isBottom && (
                        <span className="text-xs bg-pink-500/15 border border-pink-500/25 rounded px-2 py-0.5 text-pink-300">
                          🍽️ Dining
                        </span>
                      )}
                      {v.servantRoom === 'Yes' && isBottom && (
                        <span className="text-xs bg-purple-500/15 border border-purple-500/25 rounded px-2 py-0.5 text-purple-300">
                          🛏️ Servant
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Ground level features */}
            <div className="flex gap-2 mt-2 justify-center flex-wrap">
              {v.garage === 'Yes' && (
                <div className="bg-slate-500/15 border border-slate-500/25 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                  🚗 Garage
                </div>
              )}
              {v.securitySystem === 'Yes' && (
                <div className="bg-red-500/15 border border-red-500/25 rounded-lg px-3 py-1.5 text-xs text-red-300">
                  🔒 Security
                </div>
              )}
            </div>

            {/* Garden & Pool (yard level) */}
            <div className="flex gap-2 mt-2 justify-center flex-wrap">
              {v.garden === 'Yes' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-xs text-green-300">
                  🌳 Garden
                </div>
              )}
              {v.privatePool === 'Yes' && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-300">
                  🏊 Swimming Pool
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Amenity badges */}
      {activeAmenities.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Active Amenities</p>
          <div className="flex flex-wrap gap-2">
            {activeAmenities.map(({ key, label, icon, color }) => (
              <div key={key}
                className={`bg-gradient-to-br ${color} border rounded-xl px-3 py-2
                            flex items-center gap-1.5 text-sm text-white/80`}>
                <span>{icon}</span> {label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Land Plot Shape Visualizer
// ═══════════════════════════════════════════════════════════════════════════════
const LandVisualizer = ({ property }) => {
  const l = property?.landDetails || {};
  const shape = l.plotShape || 'Rectangle';

  const shapeStyles = {
    Square:    'w-48 h-48 rounded-md',
    Rectangle: 'w-64 h-40 rounded-md',
    Irregular: 'w-56 h-44 rounded-md',
  };

  // For irregular we use an SVG polygon
  const renderShape = () => {
    if (shape === 'Irregular') {
      return (
        <div className="flex justify-center">
          <svg viewBox="0 0 200 160" className="w-56 h-44">
            <polygon
              points="20,140 10,60 60,10 150,20 190,80 170,150 90,155"
              fill="rgba(34,197,94,0.1)"
              stroke="rgba(34,197,94,0.5)"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            <text x="100" y="85" textAnchor="middle" fill="rgba(34,197,94,0.8)" fontSize="12" fontWeight="bold">
              {l.totalSize || '—'} Katha
            </text>
            <text x="100" y="102" textAnchor="middle" fill="rgba(156,163,175,0.7)" fontSize="10">
              Irregular Plot
            </text>
          </svg>
        </div>
      );
    }

    return (
      <div className="flex justify-center">
        <div className={`${shapeStyles[shape]} border-2 border-dashed border-emerald-500/50
                         bg-emerald-500/10 flex flex-col items-center justify-center gap-1
                         transition-all duration-300`}>
          <span className="text-emerald-400 font-bold text-lg">{l.totalSize || '—'} Katha</span>
          <span className="text-gray-400 text-xs">{shape} Plot</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-dark-800/40 border border-white/8 rounded-2xl p-6">
      <p className="text-xs text-gray-400 mb-5 flex items-center gap-1.5">
        <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />
        Land Plot Preview — <strong className="text-white">{shape}</strong>
      </p>
      {renderShape()}

      {/* Quick info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {[
          { label: 'Type', value: l.landType || '—' },
          { label: 'Status', value: l.fillingStatus || '—' },
          { label: 'Road Access', value: l.roadAccess || '—' },
          { label: 'Construction', value: l.constructionReady || '—' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-dark-700/50 border border-white/5 rounded-xl px-3 py-2 text-center">
            <p className="text-white text-sm font-medium">{value}</p>
            <p className="text-gray-500 text-xs">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Apartment Floor Plan Visualizer (original)
// ═══════════════════════════════════════════════════════════════════════════════
const TYPE_COLORS = [
  { bg: 'bg-blue-400/20',   border: 'border-blue-400/40',   text: 'text-blue-300',   dot: 'bg-blue-400' },
  { bg: 'bg-pink-400/20',   border: 'border-pink-400/40',   text: 'text-pink-300',   dot: 'bg-pink-400' },
  { bg: 'bg-amber-400/20',  border: 'border-amber-400/40',  text: 'text-amber-300',  dot: 'bg-amber-400' },
  { bg: 'bg-teal-400/20',   border: 'border-teal-400/40',   text: 'text-teal-300',   dot: 'bg-teal-400' },
  { bg: 'bg-purple-400/20', border: 'border-purple-400/40', text: 'text-purple-300', dot: 'bg-purple-400' },
  { bg: 'bg-rose-400/20',   border: 'border-rose-400/40',   text: 'text-rose-300',   dot: 'bg-rose-400' },
  { bg: 'bg-cyan-400/20',   border: 'border-cyan-400/40',   text: 'text-cyan-300',   dot: 'bg-cyan-400' },
  { bg: 'bg-lime-400/20',   border: 'border-lime-400/40',   text: 'text-lime-300',   dot: 'bg-lime-400' },
  { bg: 'bg-orange-400/20', border: 'border-orange-400/40', text: 'text-orange-300', dot: 'bg-orange-400' },
  { bg: 'bg-indigo-400/20', border: 'border-indigo-400/40', text: 'text-indigo-300', dot: 'bg-indigo-400' },
  { bg: 'bg-emerald-400/20',border: 'border-emerald-400/40',text: 'text-emerald-300',dot: 'bg-emerald-400' },
  { bg: 'bg-fuchsia-400/20',border: 'border-fuchsia-400/40',text: 'text-fuchsia-300',dot: 'bg-fuchsia-400' },
];

/** Get flat type index for a unit based on its column letter */
const getTypeIndexForUnit = (unit, flatTypes) => {
  if (!flatTypes?.length) return -1;
  const match = unit.unitNumber?.match(/\d+([A-Z]+)/i);
  if (!match) return 0;
  const colIndex = match[1].charCodeAt(0) - 65;
  return Math.min(colIndex, flatTypes.length - 1);
};

const ApartmentVisualizer = ({ units, grouped, stats, property, onUnitClick }) => {
  const [filter, setFilter] = useState('all');
  const flatTypes = property?.flatTypes || [];
  const hasFlatTypes = flatTypes.length > 0;

  const floorNumbers = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  const filteredGrouped = filter === 'all'
    ? grouped
    : Object.fromEntries(
        Object.entries(grouped).map(([floor, floorUnits]) => [
          floor,
          floorUnits.filter((u) => u.status === filter),
        ]).filter(([, u]) => u.length > 0)
      );

  const filteredFloors = Object.keys(filteredGrouped)
    .map(Number)
    .sort((a, b) => b - a);

  if (units.length === 0) {
    return (
      <div className="glass-card py-12 text-center">
        <p className="text-gray-400 text-sm">No units available for this property yet.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Units',  value: stats.total,     color: 'text-white'         },
          { label: 'Available',    value: stats.available, color: 'text-emerald-400'   },
          { label: 'Booked',       value: stats.booked,    color: 'text-amber-400'     },
          { label: 'Sold',         value: stats.sold,      color: 'text-red-400'       },
        ].map(({ label, value, color }) => (
          <div key={label}
            className="bg-dark-800/60 border border-white/8 rounded-xl px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-gray-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Flat type legend (when flatTypes exist) */}
      {hasFlatTypes && (
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-white/3 rounded-xl border border-white/5">
          <span className="text-xs text-gray-500 self-center">Unit Types:</span>
          {flatTypes.map((ft, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`w-3 h-3 rounded-full ${TYPE_COLORS[idx % TYPE_COLORS.length].dot}`} />
              <span className="text-white font-medium">{ft.label || `Type ${String.fromCharCode(65 + idx)}`}</span>
              {ft.sqft && <span className="text-gray-600">({ft.sqft} sft)</span>}
            </div>
          ))}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                        border transition-all duration-200
                        ${filter === f
                          ? 'bg-primary-500/20 border-primary-500/50 text-primary-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                        }`}
          >
            {f !== 'all' && (
              <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[f]?.dot}`} />
            )}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="text-gray-500">({stats[f] ?? 0})</span>
            )}
          </button>
        ))}
      </div>

      {/* Floor plan grid */}
      <div className="bg-dark-800/40 border border-white/8 rounded-2xl p-4 sm:p-6 overflow-x-auto">
        {filteredFloors.length === 0 ? (
          <p className="text-gray-500 text-center py-8 text-sm">
            No {filter} units found.
          </p>
        ) : (
          <div className="space-y-2 min-w-max mx-auto">
            {filteredFloors.map((floorNum) => {
              const floorUnits = filteredGrouped[floorNum] || [];
              return (
                <div key={floorNum} className="flex items-center gap-3">
                  <div className="w-12 flex-shrink-0 text-right">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      F{floorNum}
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {floorUnits.map((unit) => {
                      const statusCfg = STATUS_CONFIG[unit.status];
                      const isSold = unit.status === 'sold';
                      const typeIdx = hasFlatTypes ? getTypeIndexForUnit(unit, flatTypes) : -1;
                      const typeColor = typeIdx >= 0 ? TYPE_COLORS[typeIdx % TYPE_COLORS.length] : null;
                      const ft = typeIdx >= 0 ? flatTypes[typeIdx] : null;
                      const typeLabel = ft?.label?.trim() || (typeIdx >= 0 ? String.fromCharCode(65 + typeIdx) : '');

                      return (
                        <button
                          key={unit._id}
                          onClick={() => !isSold && onUnitClick?.(unit)}
                          className={`w-14 h-14 rounded-xl border flex flex-col items-center
                                      justify-center gap-0.5 transition-all duration-200
                                      ${statusCfg.bg} ${isSold ? '' : 'cursor-pointer'}
                                      ${hasFlatTypes && typeColor ? `border-l-4 ${typeColor.border.replace('border-', 'border-l-')}` : ''}`}
                          title={`Unit ${unit.unitNumber} — ${statusCfg.label}${ft ? ` (${ft.label || 'Type ' + String.fromCharCode(65 + typeIdx)})` : ''}`}
                        >
                          <span className={`text-xs font-bold leading-tight ${statusCfg.text}`}>
                            {unit.unitNumber}
                          </span>
                          {typeLabel && (
                            <span className="text-gray-500 leading-tight truncate w-full text-center px-0.5"
                                  style={{ fontSize: '8px' }}>
                              {typeLabel}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {Object.entries(STATUS_CONFIG).map(([key, { dot, label }]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${dot}`} />
            <span className="text-gray-400 text-xs">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main UnitVisualizer — branches by category
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * UnitVisualizer — Interactive floor plan / visual component
 *
 * Props:
 *  - units:    Unit[]  — flat array from API
 *  - grouped:  { [floor]: Unit[] } — pre-grouped by floor
 *  - stats:    { total, available, booked, sold }
 *  - property: { price, category, villaDetails, landDetails }
 *  - onUnitClick: (unit) => void
 */
const UnitVisualizer = ({ units = [], grouped = {}, stats = {}, property, onUnitClick }) => {
  const category = property?.category?.toLowerCase();

  if (category === 'villa') {
    return <VillaVisualizer property={property} />;
  }

  if (category === 'land') {
    return <LandVisualizer property={property} />;
  }

  // Default: Apartment floor plan
  return (
    <ApartmentVisualizer
      units={units}
      grouped={grouped}
      stats={stats}
      property={property}
      onUnitClick={onUnitClick}
    />
  );
};

export default UnitVisualizer;
