import { useState, useMemo, useEffect } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

const MAX_INSTALLMENTS = 24;

const tierExtraPercentage = (n) => {
  if (!n || n < 1) return null;
  if (n <= 4)  return 0;
  if (n <= 12) return 7;
  if (n <= 24) return 12;
  return null;
};

const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

/**
 * Modal: Set Installment plan for a booking.
 * Shows the full installment policy + an input field for desired count.
 * Confirms via POST /api/installments/setup.
 *
 * Props:
 *   open, onClose, booking (must include _id, totalPrice, bookingAmount)
 *   onSuccess(plan)  — called after the plan is locked in
 */
const InstallmentSetupModal = ({ open, onClose, booking, onSuccess }) => {
  const [count,    setCount]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const [settings, setSettings] = useState({
    inactivityCancelMonths: 3,
    inactivityWarnMonths: 2,
    refundWindowDays: 30,
    refundRetentionPercentage: 20,
  });

  useEffect(() => {
    if (!open) return;
    axiosInstance.get('/settings/public')
      .then(({ data }) => {
        if (data?.data?.settings) {
          setSettings(data.data.settings);
        }
      })
      .catch((err) => console.error('Failed to load public policy settings', err));
  }, [open]);

  const dueAmount = useMemo(
    () => Math.max(0, (booking?.totalPrice || 0) - (booking?.bookingAmount || 0)),
    [booking]
  );

  // Live preview of per-installment amount + total cost
  const preview = useMemo(() => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1 || n > MAX_INSTALLMENTS) return null;
    if (dueAmount <= 0) return null;

    const extraPct = tierExtraPercentage(n);
    const baseEach = Math.floor(dueAmount / n);
    const lastBase = dueAmount - baseEach * (n - 1);
    const extraReg = Math.round(baseEach * extraPct / 100);
    const extraLst = Math.round(lastBase * extraPct / 100);
    const perInst  = baseEach + extraReg;
    const lastInst = lastBase + extraLst;
    const totalPay = extraPct === 0
      ? dueAmount
      : (n - 1) * perInst + lastInst;

    return { n, extraPct, perInst, lastInst, totalPay, allEqual: perInst === lastInst };
  }, [count, dueAmount]);

  if (!open) return null;

  const handleCountChange = (v) => {
    setError('');
    setCount(v);
    const n = Number(v);
    if (v && (!Number.isInteger(n) || n < 1)) {
      setError('Please enter a valid positive whole number.');
    } else if (n > MAX_INSTALLMENTS) {
      setError(`Maximum installment limit is ${MAX_INSTALLMENTS}.`);
    }
  };

  const handleConfirm = async () => {
    const n = Number(count);
    if (!Number.isInteger(n) || n < 1) {
      setError('Please enter a valid positive whole number.');
      return;
    }
    if (n > MAX_INSTALLMENTS) {
      setError(`Maximum installment limit is ${MAX_INSTALLMENTS}.`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/installments/setup', {
        bookingId:         booking._id,
        totalInstallments: n,
      });
      toast.success(`Installment plan with ${n} installment${n > 1 ? 's' : ''} created.`);
      onSuccess?.(data.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create installment plan.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-blue-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Set Installment Plan</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Split your remaining dues into easy monthly installments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 hover:bg-blue-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-5">

          {/* Policy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Column 1: Installment Policy */}
            <div className="bg-gradient-to-br from-blue-50/40 to-slate-50 border border-blue-100 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>📅</span> Installment Policy
                </h3>
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Up to <strong>4 installments</strong>: 0% extra charge (Free).</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span><strong>5 to 12 installments</strong>: 7% charge added per installment.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-orange-600 font-bold">•</span>
                    <span><strong>13 to 24 installments</strong>: 12% charge added per installment.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Max limit: <strong>24 installments</strong>.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span>Due Date: Pay between the <strong>1st and 15th</strong> of the month.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Missed/Late payment adds a <strong>৳5,000 late fee</strong>.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 2: Voluntary Refund Policy */}
            <div className="bg-gradient-to-br from-emerald-50/40 to-slate-50 border border-emerald-100 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>↩️</span> Refund Policy
                </h3>
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>Refund requests are valid within <strong>{settings.refundWindowDays} days</strong> of booking.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>A non-refundable retention fee of <strong>{settings.refundRetentionPercentage}%</strong> is kept.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>No refunds are permitted after the {settings.refundWindowDays}-day window expires.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Column 3: Auto-Cancellation Policy */}
            <div className="bg-gradient-to-br from-amber-50/40 to-slate-50 border border-amber-100 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>🚫</span> Inactivity Cancellation
                </h3>
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Inactivity warning is sent after <strong>{settings.inactivityWarnMonths} months</strong> of no payment.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Auto-cancellation occurs after <strong>{settings.inactivityCancelMonths} months</strong> of total payment inactivity.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>In case of auto-cancellation, <strong>0% refund</strong> is provided.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>


          {/* Due summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-blue-100 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Price</p>
              <p className="text-sm font-bold text-gray-900">{fmt(booking?.totalPrice)}</p>
            </div>
            <div className="bg-slate-50 border border-blue-100 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Booking Paid</p>
              <p className="text-sm font-bold text-emerald-600">{fmt(booking?.bookingAmount)}</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-[10px] text-amber-300 uppercase tracking-wider mb-1">Remaining Due</p>
              <p className="text-sm font-bold text-amber-300">{fmt(dueAmount)}</p>
            </div>
          </div>

          {/* Input */}
          <div>
            <label className="form-label">
              Number of Installments <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={MAX_INSTALLMENTS}
              step="1"
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
              className="form-input"
              placeholder="e.g. 6"
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-xs mt-1.5 flex items-center gap-1.5">
                <span>⚠️</span> {error}
              </p>
            )}
            <p className="text-gray-500 text-[11px] mt-1.5">
              Allowed: 1 – {MAX_INSTALLMENTS} installments
            </p>
          </div>

          {/* Live preview */}
          {preview && (
            <section className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 animate-fadeIn">
              <h4 className="text-sm font-bold text-primary-600 mb-3 flex items-center gap-2">
                💡 Plan Preview
              </h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="text-gray-500">Tier</div>
                <div className="text-gray-900 font-semibold text-right">
                  {preview.extraPct === 0
                    ? 'Free (no extra charge)'
                    : `${preview.extraPct}% per installment`}
                </div>
                <div className="text-gray-500">Each Installment</div>
                <div className="text-gray-900 font-semibold text-right">
                  {fmt(preview.perInst)}
                  {!preview.allEqual && <span className="text-gray-500"> (last: {fmt(preview.lastInst)})</span>}
                </div>
                <div className="text-gray-500">Total Payable Over {preview.n} Month{preview.n > 1 ? 's' : ''}</div>
                <div className="font-bold text-emerald-600 text-right">{fmt(preview.totalPay)}</div>
                {preview.extraPct > 0 && (
                  <>
                    <div className="text-gray-500">Premium vs. Lump Sum</div>
                    <div className="text-amber-600 text-right">+ {fmt(preview.totalPay - dueAmount)}</div>
                  </>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
                First installment is due on the <strong>15th of this month</strong>. Each subsequent
                installment falls on the 15th of the next month. Paying after the 15th adds a
                ৳5,000 late fee to that installment.
              </p>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-blue-100 flex justify-end gap-3 bg-white/70">
          <button
            onClick={onClose}
            disabled={loading}
            className="btn-secondary px-5 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !preview || !!error}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Confirm Plan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallmentSetupModal;
