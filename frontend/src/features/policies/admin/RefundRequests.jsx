import { useState, useEffect } from 'react';
import axiosInstance from '../../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// RefundRequests — Policy 2 Super Admin oversight. Read-only on the 20% rule;
// the admin can only advance an approved refund to "completed" (disbursed).
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:   'bg-amber-500/15 text-amber-600 border-amber-500/30',
  approved:  'bg-blue-500/15 text-blue-600 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  rejected:  'bg-red-500/15 text-red-600 border-red-500/30',
};
const fmt = (n) => (n ? `৳${Number(n).toLocaleString()}` : '৳0');

const RefundRequests = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy]       = useState(null);

  const load = () => {
    setLoading(true);
    axiosInstance.get('/refunds')
      .then(({ data }) => setRefunds(data.data.refunds))
      .catch(() => toast.error('Failed to load refunds'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const complete = async (id) => {
    setBusy(id);
    try {
      await axiosInstance.patch(`/refunds/${id}/complete`);
      toast.success('Refund marked completed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="text-gray-500 py-10 text-center">Loading refunds…</div>;
  if (refunds.length === 0) {
    return (
      <div className="glass-card py-16 text-center">
        <p className="text-4xl mb-3">📭</p>
        <p className="text-gray-900 font-medium">No refund requests yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-blue-100">
            <th className="p-3">Property</th>
            <th className="p-3">Customer</th>
            <th className="p-3">Vendor</th>
            <th className="p-3">Paid</th>
            <th className="p-3">Refund (80%)</th>
            <th className="p-3">Retained</th>
            <th className="p-3">Status</th>
            <th className="p-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {refunds.map((r) => (
            <tr key={r._id} className="border-b border-slate-100 text-gray-600">
              <td className="p-3">{r.bookingId?.propertyId?.title || '—'}</td>
              <td className="p-3">
                <div>{r.customerId?.name || '—'}</div>
                <div className="text-xs text-gray-500">{r.customerId?.email}</div>
              </td>
              <td className="p-3">{r.companyId?.name || '—'}</td>
              <td className="p-3">{fmt(r.amountPaid)}</td>
              <td className="p-3 text-emerald-600 font-semibold">{fmt(r.refundAmount)}</td>
              <td className="p-3 text-amber-600">{fmt(r.retentionAmount)} <span className="text-[10px] text-gray-500">({r.retentionPercentage}%)</span></td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[r.status]}`}>
                  {r.status.toUpperCase()}
                </span>
              </td>
              <td className="p-3">
                {r.status === 'approved' ? (
                  <button
                    onClick={() => complete(r._id)}
                    disabled={busy === r._id}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-60"
                  >
                    {busy === r._id ? '…' : 'Mark Completed'}
                  </button>
                ) : <span className="text-xs text-gray-600">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RefundRequests;
