import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG = {
  available: { label: 'Available', color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30' },
  booked:    { label: 'Booked',    color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30'   },
  sold:      { label: 'Sold Out',  color: 'text-red-400',     bg: 'bg-red-500/15 border-red-500/30'       },
};

/**
 * UnitDetailModal — shown when user clicks a unit in the visualizer
 *
 * Props:
 *  - unit:      Unit object
 *  - property:  Property object (for base price fallback)
 *  - onClose:   () => void
 */
const UnitDetailModal = ({ unit, property, onClose }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!unit) return null;

  const displayPrice = unit.price || property?.price;
  const cfg = STATUS_CONFIG[unit.status];

  const handleBooking = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/bookings', {
        unitId: unit._id,
        message
      });
      toast.success('Booking requested successfully!');
      setTimeout(() => {
        onClose();
        // optionally refresh parent or redirect, but for now we instruct the user to check dashboard
        navigate('/customer-dashboard');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request booking');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                    bg-black/70 backdrop-blur-sm animate-fadeIn px-0 sm:px-4"
         onClick={(e) => e.target === e.currentTarget && onClose()}>

      <div className="w-full sm:max-w-sm glass-card rounded-t-3xl sm:rounded-2xl
                      p-6 pb-8 sm:pb-6 animate-slideUp">

        {/* Handle bar (mobile) */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">
              Floor {unit.floor}
            </p>
            <h2 className="text-2xl font-black text-white">
              Unit {unit.unitNumber}
            </h2>
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

        {/* Details grid */}
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
