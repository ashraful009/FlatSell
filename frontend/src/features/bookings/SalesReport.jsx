import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

// ── Date preset helpers ───────────────────────────────────────────────────────
const toISO = (d) => d.toISOString().split('T')[0];

const getPresetRange = (preset) => {
  const now   = new Date();
  const today = toISO(now);
  switch (preset) {
    case 'today': return { startDate: today, endDate: today };
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      return { startDate: toISO(d), endDate: today };
    }
    case 'month': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: toISO(d), endDate: today };
    }
    case 'year': {
      return { startDate: `${now.getFullYear()}-01-01`, endDate: today };
    }
    default: return { startDate: '', endDate: '' };
  }
};

const STATUS_COLORS = {
  booking_paid: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  fully_paid:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const CAT_ICONS = { apartment: '🏢', villa: '🏡', land: '🌿' };

// ─────────────────────────────────────────────────────────────────────────────
const SalesReport = ({ mode = 'company' }) => {
  const [bookings,     setBookings]     = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [downloading,  setDownloading]  = useState(false);
  const [preset,       setPreset]       = useState('month');
  const [customStart,  setCustomStart]  = useState('');
  const [customEnd,    setCustomEnd]    = useState('');
  const [useCustom,    setUseCustom]    = useState(false);

  const { startDate, endDate } = useCustom
    ? { startDate: customStart, endDate: customEnd }
    : getPresetRange(preset);

  const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

  const fetchReport = useCallback(async () => {
    if (useCustom && (!customStart || !customEnd)) return;
    setLoading(true);
    try {
      const params = startDate && endDate ? { startDate, endDate } : {};
      const { data } = await axiosInstance.get('/bookings/sales-report', { params });
      setBookings(data.data.bookings || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load sales report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, useCustom, customStart, customEnd]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = startDate && endDate ? { startDate, endDate } : {};
      const res = await axiosInstance.get('/bookings/sales-report/pdf', {
        params,
        responseType: 'blob',
      });
      const url      = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = `FlatSell-Sales-Report-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Sales report downloaded!');
    } catch {
      toast.error('Failed to generate PDF report');
    } finally {
      setDownloading(false);
    }
  };

  const totalRevenue = bookings.reduce(
    (s, b) => s + (b.paymentStatus === 'fully_paid' ? b.totalPrice : b.bookingAmount || 0), 0
  );
  const totalVolume = bookings.reduce((s, b) => s + (b.totalPrice || 0), 0);

  const PRESETS = [
    { key: 'today', label: 'Today'     },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month'},
    { key: 'year',  label: 'This Year' },
  ];

  return (
    <div className="space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {mode === 'admin' ? '📈 Platform Sales Report' : '📈 My Sales Report'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {mode === 'admin'
              ? 'View all confirmed bookings and revenue across the platform.'
              : 'View confirmed bookings and revenue for your company.'}
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading || loading || bookings.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600
                     text-white text-sm font-semibold transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed shadow-glow"
        >
          {downloading
            ? (<><span className="animate-spin">⏳</span> Generating...</>)
            : (<>📥 Download Report</>)}
        </button>
      </div>

      {/* ── Date Filter Bar ───────────────────────────────────────────────── */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <span className="text-gray-400 text-sm font-medium">Filter by:</span>

        <div className="flex gap-1 bg-dark-800/50 p-1 rounded-lg">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => { setPreset(p.key); setUseCustom(false); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                ${!useCustom && preset === p.key
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'text-gray-400 hover:text-white'}`}
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => setUseCustom(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
              ${useCustom
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'text-gray-400 hover:text-white'}`}
          >
            Custom
          </button>
        </div>

        {useCustom && (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-dark-800 border border-white/10 text-gray-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary-500"
            />
            <span className="text-gray-500 text-xs">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-dark-800 border border-white/10 text-gray-200 text-xs rounded-lg px-3 py-1.5 outline-none focus:border-primary-500"
            />
            <button
              onClick={fetchReport}
              className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings',         value: bookings.length,      icon: '📋', color: 'blue'    },
          { label: 'Revenue Collected',       value: fmt(totalRevenue),    icon: '💰', color: 'emerald' },
          { label: 'Total Property Volume',   value: fmt(totalVolume),     icon: '📊', color: 'primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`glass-card p-5 border border-${color}-500/20`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center text-lg`}>
                {icon}
              </div>
              <div>
                <p className="text-gray-400 text-xs">{label}</p>
                <p className="text-white font-bold text-lg">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mb-4" />
            <p className="text-gray-400 text-sm">Loading sales data…</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-lg font-bold text-white mb-2">No Sales Found</h3>
            <p className="text-gray-400 text-sm">No confirmed bookings for the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-dark-800/50">
                  <th className="text-left text-gray-400 text-xs font-semibold px-5 py-3">#</th>
                  <th className="text-left text-gray-400 text-xs font-semibold px-4 py-3">Property</th>
                  {mode === 'admin' && <th className="text-left text-gray-400 text-xs font-semibold px-4 py-3">Company</th>}
                  <th className="text-left text-gray-400 text-xs font-semibold px-4 py-3">Customer</th>
                  <th className="text-left text-gray-400 text-xs font-semibold px-4 py-3">Category</th>
                  <th className="text-left text-gray-400 text-xs font-semibold px-4 py-3">Status</th>
                  <th className="text-right text-gray-400 text-xs font-semibold px-4 py-3">Total Price</th>
                  <th className="text-right text-gray-400 text-xs font-semibold px-4 py-3">Paid</th>
                  <th className="text-left text-gray-400 text-xs font-semibold px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b, i) => (
                  <tr key={b._id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-5 py-3.5 text-gray-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{CAT_ICONS[b.propertyId?.category] || '🏠'}</span>
                        <span className="text-white font-medium truncate max-w-[160px]" title={b.propertyId?.title}>
                          {b.propertyId?.title || '—'}
                        </span>
                      </div>
                    </td>
                    {mode === 'admin' && (
                      <td className="px-4 py-3.5 text-gray-300 text-xs">{b.companyId?.name || '—'}</td>
                    )}
                    <td className="px-4 py-3.5">
                      <p className="text-gray-200 text-xs">{b.customerId?.name || '—'}</p>
                      <p className="text-gray-500 text-[11px]">{b.customerId?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/10 text-gray-300">
                        {b.propertyId?.category || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[b.paymentStatus] || 'text-gray-400'}`}>
                        {b.paymentStatus === 'fully_paid' ? 'Fully Paid' : 'Booking Paid'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-white font-semibold text-xs">{fmt(b.totalPrice)}</td>
                    <td className="px-4 py-3.5 text-right text-emerald-400 font-bold text-xs">
                      {fmt(b.paymentStatus === 'fully_paid' ? b.totalPrice : b.bookingAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(b.createdAt).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesReport;
