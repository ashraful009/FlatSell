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

/**
 * UnitVisualizer — Interactive floor plan component
 *
 * Props:
 *  - units:    Unit[]  — flat array from API
 *  - grouped:  { [floor]: Unit[] } — pre-grouped by floor
 *  - stats:    { total, available, booked, sold }
 *  - property: { price } — fallback price
 *  - onUnitClick: (unit) => void
 */
const UnitVisualizer = ({ units = [], grouped = {}, stats = {}, property, onUnitClick }) => {
  const [filter, setFilter] = useState('all');

  // Sort floors descending (top floor first)
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
      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
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

      {/* ── Status filter tabs ──────────────────────────────────────────────── */}
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

      {/* ── Floor plan grid ─────────────────────────────────────────────────── */}
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
                  {/* Floor label */}
                  <div className="w-12 flex-shrink-0 text-right">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      F{floorNum}
                    </span>
                  </div>

                  {/* Units row */}
                  <div className="flex gap-2 flex-wrap">
                    {floorUnits.map((unit) => {
                      const cfg = STATUS_CONFIG[unit.status];
                      const isSold = unit.status === 'sold';
                      return (
                        <button
                          key={unit._id}
                          onClick={() => !isSold && onUnitClick?.(unit)}
                          className={`w-14 h-14 rounded-xl border flex flex-col items-center
                                      justify-center gap-0.5 transition-all duration-200
                                      ${cfg.bg} ${isSold ? '' : 'cursor-pointer'}`}
                          title={`Unit ${unit.unitNumber} — ${cfg.label}`}
                        >
                          <span className={`text-xs font-bold leading-tight ${cfg.text}`}>
                            {unit.unitNumber}
                          </span>
                          {unit.type && (
                            <span className="text-gray-500 text-xs leading-tight" style={{ fontSize: '9px' }}>
                              {unit.type}
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

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
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

export default UnitVisualizer;
