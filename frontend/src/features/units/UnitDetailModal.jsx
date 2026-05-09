import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  booked:    { label: 'Booked',    color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30'   },
  sold:      { label: 'Sold Out',  color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30'       },
};

/**
 * Get flat type info for a unit based on its column index.
 * Column mapping: col 0 → flatTypes[0], col 1 → flatTypes[1], ... last type extends to remaining columns.
 */
const getFlatTypeForUnit = (unit, property) => {
  const flatTypes = property?.flatTypes;
  if (!flatTypes?.length || property?.category !== 'apartment') return null;

  // Extract column letter from unitNumber (e.g. "3B" → "B" → index 1)
  const match = unit.unitNumber?.match(/\d+([A-Z]+)/i);
  if (!match) return null;
  const colIndex = match[1].charCodeAt(0) - 65; // A=0, B=1, C=2...
  const typeIndex = Math.min(colIndex, flatTypes.length - 1);
  return flatTypes[typeIndex] || null;
};

/**
 * UnitDetailModal — shown when user clicks a unit in the visualizer
 *
 * Props:
 *  - unit:      Unit object
 *  - property:  Property object (for base price fallback + flatTypes)
 *  - onClose:   () => void
 */
const UnitDetailModal = ({ unit, property, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!unit) return null;

  const cfg = STATUS_CONFIG[unit.status];
  const flatType = getFlatTypeForUnit(unit, property);
  const displayPrice = flatType?.pricePerUnit || unit.price || property?.price;

  const handleBooking = () => {
    navigate(`/booking-checkout/${unit._id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    bg-black/70 backdrop-blur-sm animate-fadeIn px-0 sm:px-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="w-full sm:max-w-md glass-card rounded-t-3xl sm:rounded-2xl
                      p-6 pb-8 sm:pb-6 animate-slideUp max-h-[90vh] overflow-y-auto">

        {/* Handle bar (mobile) */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            {property?.category === 'apartment' ? (
              <>
                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
                  Floor {unit.floor}
                </p>
                <h2 className="text-2xl font-black text-white">
                  Unit {unit.unitNumber}
                </h2>
              </>
            ) : (
              <h2 className="text-2xl font-black text-white capitalize">
                {property?.category} Booking
              </h2>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-lg border font-semibold
                             ${cfg.bg} ${cfg.color}`}>
              {cfg.label}
            </span>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white
                         hover:bg-white/10 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Flat Type Details (Apartment category) ──────────────────────── */}
        {flatType ? (
          <div className="space-y-4 mb-5">
            {/* Type header */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <span className="text-primary-400 text-sm">🏷️</span>
              <span className="text-primary-300 font-semibold text-sm">
                {flatType.label || 'Unnamed Type'}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '📐', label: 'Square Feet',     value: flatType.sqft ? `${flatType.sqft} sft` : '—' },
                { icon: '💰', label: 'Price (BDT)',      value: flatType.pricePerUnit ? `৳${Number(flatType.pricePerUnit).toLocaleString()}` : '—' },
                { icon: '🛏️', label: 'Bedrooms',         value: flatType.bedrooms ?? '—' },
                { icon: '🚿', label: 'Washrooms',        value: flatType.bathrooms ?? '—' },
                { icon: '🍳', label: 'Kitchen',          value: flatType.kitchen || '—' },
                { icon: '🍽️', label: 'Dining',           value: flatType.dining || '—' },
                { icon: '🖼️', label: 'Drawing',          value: flatType.drawing || '—' },
                { icon: '🅿️', label: 'Parking Area',     value: flatType.parking || '—' },
              ].map(({ icon, label, value }) => (
                <div key={label}
                  className="bg-dark-800/60 border border-white/8 rounded-xl px-3 py-2.5">
                  <p className="text-gray-500 text-xs mb-0.5">{icon} {label}</p>
                  <p className="text-white font-semibold text-sm">{value}</p>
                </div>
              ))}
            </div>

            {/* Type Description */}
            {flatType.description && (
              <div className="bg-dark-800/60 border border-white/8 rounded-xl px-3 py-2.5">
                <p className="text-gray-500 text-xs mb-1">📝 Type Description</p>
                <p className="text-gray-300 text-sm leading-relaxed">{flatType.description}</p>
              </div>
            )}
          </div>
        ) : (
          /* Fallback: generic unit details (non-apartment or no flatTypes) */
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { label: 'Type',   value: unit.type   || '—' },
              { label: 'Size',   value: unit.size   || '—' },
              { label: 'Facing', value: unit.facing || '—' },
              {
                label: 'Price',
                value: displayPrice ? `৳${displayPrice.toLocaleString()}` : '—'
              },
            ].map(({ label, value }) => (
              <div key={label}
                className="bg-dark-800/60 border border-white/8 rounded-xl px-3 py-2.5">
                <p className="text-gray-500 text-xs mb-0.5">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        {unit.features?.length > 0 && (
          <div className="mb-5">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Features</p>
            <div className="flex flex-wrap gap-1.5">
              {unit.features.map((f) => (
                <span key={f}
                  className="text-xs px-2 py-1 bg-white/5 border border-white/10
                             text-gray-300 rounded-lg">
                  ✦ {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA by status */}
        {unit.status === 'available' ? (
          isAuthenticated ? (
            <div className="space-y-3">
              <textarea
                className="form-input resize-none w-full text-sm"
                rows="2"
                placeholder="Message to the vendor (optional)..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button
                onClick={handleBooking}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? 'Confirming...' : '📋 Request Booking'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary w-full text-center block">
              Login to Book this Unit
            </Link>
          )
        ) : (
          <div className={`w-full py-3 rounded-xl text-center text-sm font-semibold
                          ${cfg.bg} ${cfg.color} border`}>
            {unit.status === 'booked' ? '⏳ This unit is already booked' : '🚫 This unit has been sold'}
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitDetailModal;
