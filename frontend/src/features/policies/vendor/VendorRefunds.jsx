import { useState, useEffect } from 'react';
import axiosInstance from '../../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// VendorRefunds — Policy 2 vendor view: wallet balance + the refund deductions
// taken from this vendor's account, with booking details.
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  pending:   'bg-amber-500/15 text-amber-600 border-amber-500/30',
  approved:  'bg-blue-500/15 text-blue-600 border-blue-500/30',
  completed: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  rejected:  'bg-red-500/15 text-red-600 border-red-500/30',
};
const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

const VendorRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [wallet, setWallet]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/refunds/vendor')
      .then(({ data }) => { setRefunds(data.data.refunds); setWallet(data.data.walletBalance); })
      .catch(() => toast.error('Failed to load refunds'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 py-10 text-center">Loading refunds…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Refunds</h2>
        <p className="text-gray-500 text-sm mt-1">Customer refunds are paid from your vendor wallet.</p>
      </div>

      {/* Wallet balance */}
      <div className={`glass-card p-5 border-l-4 ${wallet < 0 ? 'border-l-red-500' : 'border-l-emerald-500'}`}>
        <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Vendor Wallet Balance</p>
        <p className={`text-3xl font-black ${wallet < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(wallet)}</p>
        {wallet < 0 && (
          <p className="text-xs text-amber-600 mt-1">Negative balance reflects refunds paid out beyond credited funds.</p>
        )}
      </div>

      {refunds.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-900 font-medium">No refund deductions yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto glass-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-blue-100">
                <th className="p-3">Property</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Customer Paid</th>
                <th className="p-3">Deducted (80%)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
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
                  <td className="p-3">{fmt(r.amountPaid)}</td>
                  <td className="p-3 text-red-600 font-semibold">− {fmt(r.refundAmount)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[r.status]}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-xs">{new Date(r.requestedAt || r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VendorRefunds;
