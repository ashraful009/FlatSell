import { useState, useEffect } from 'react';
import axiosInstance from '../../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// AutoCancelledBookings — Policy 1 Super Admin view: a filterable list of
// cancelled bookings (auto inactivity / manual / refund-driven).
// ─────────────────────────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'inactivity',       label: '🚫 Auto (Inactivity)' },
  { id: 'refund_requested', label: '↩️ Refund-Cancelled'  },
  { id: 'manual',           label: '✋ Manual'            },
];

const fmt = (n) => (n ? `৳${Number(n).toLocaleString()}` : '—');

const AutoCancelledBookings = () => {
  const [filter, setFilter]     = useState('inactivity');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async (reason) => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/bookings/auto-cancelled?reason=${reason}`);
        setBookings(data.data.bookings);
      } catch {
        toast.error('Failed to load cancelled bookings');
      } finally {
        setLoading(false);
      }
    };
    load(filter);
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all
              ${filter === f.id ? 'bg-primary-500/20 text-primary-600 border-primary-500/30'
                                : 'text-gray-500 border-blue-100 hover:text-gray-900'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-gray-500 py-10 text-center">Loading…</div>
      ) : bookings.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-900 font-medium">No bookings in this category</p>
        </div>
      ) : (
        <div className="overflow-x-auto glass-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-blue-100">
                <th className="p-3">Property</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Vendor</th>
                <th className="p-3">Paid</th>
                <th className="p-3">Refund</th>
                <th className="p-3">Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} className="border-b border-slate-100 text-gray-600">
                  <td className="p-3">{b.propertyId?.title || '—'}</td>
                  <td className="p-3">
                    <div>{b.customerId?.name || '—'}</div>
                    <div className="text-xs text-gray-500">{b.customerId?.email}</div>
                  </td>
                  <td className="p-3">{b.companyId?.name || '—'}</td>
                  <td className="p-3">{fmt(b.bookingAmount)}</td>
                  <td className="p-3">
                    {b.noRefund
                      ? <span className="text-red-600 font-semibold">No Refund</span>
                      : b.refundAmount > 0 ? <span className="text-emerald-600">{fmt(b.refundAmount)}</span> : '—'}
                  </td>
                  <td className="p-3 text-xs">{b.cancelledAt ? new Date(b.cancelledAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AutoCancelledBookings;
