import { useState } from 'react';
import PolicySettings        from './PolicySettings';
import AutoCancelledBookings from './AutoCancelledBookings';
import RefundRequests        from './RefundRequests';
import BookingLimitOverrides from './BookingLimitOverrides';

// ─────────────────────────────────────────────────────────────────────────────
// PolicyCenter — Super Admin hub for all three booking policies, grouped under
// one dashboard tab with internal sub-tabs.
// ─────────────────────────────────────────────────────────────────────────────
const SUBTABS = [
  { id: 'settings',   label: '⚙️ Settings',           render: () => <PolicySettings /> },
  { id: 'cancelled',  label: '🚫 Auto-Cancelled',     render: () => <AutoCancelledBookings /> },
  { id: 'refunds',    label: '↩️ Refund Requests',    render: () => <RefundRequests /> },
  { id: 'limits',     label: '🚦 Booking Limits',     render: () => <BookingLimitOverrides /> },
];

const PolicyCenter = () => {
  const [sub, setSub] = useState('settings');

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Booking Policies</h2>
        <p className="text-gray-500 text-sm mt-1">Auto-cancellation, refunds, and booking limits.</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-50 p-1.5 rounded-xl overflow-x-auto">
        {SUBTABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex-1 min-w-[150px] py-2 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap
              ${sub === t.id ? 'bg-primary-500/20 text-primary-600 border border-primary-500/30'
                             : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50 border border-transparent'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="animate-fadeIn">
        {SUBTABS.find((t) => t.id === sub)?.render()}
      </div>
    </div>
  );
};

export default PolicyCenter;
