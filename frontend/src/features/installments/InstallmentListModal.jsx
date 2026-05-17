import { useEffect, useState } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

const fmt     = (n) => `৳${Number(n || 0).toLocaleString()}`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Modal: List all installments for a booking.
 * Shows status, due date, amount, payable amount (with late fee if overdue),
 * and a Pay / Download Invoice button per row.
 *
 * Props:
 *   open, onClose, bookingId
 */
const InstallmentListModal = ({ open, onClose, bookingId }) => {
  const [plan,          setPlan]          = useState(null);
  const [installments,  setInstallments]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [payingId,      setPayingId]      = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchList = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/installments/booking/${bookingId}`);
      setPlan(data.data.plan);
      setInstallments(data.data.installments || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load installments.');
      setInstallments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId]);

  const handlePay = async (inst) => {
    if (inst.isOverdue) {
      const ok = window.confirm(
        `⚠️ This installment is overdue.\n\n` +
        `A late fee of ৳5,000 will be added.\n\n` +
        `Original amount: ${fmt(inst.amountDue)}\n` +
        `Late fee:        ৳5,000\n` +
        `Total to pay:    ${fmt(inst.payableNow)}\n\n` +
        `Proceed to payment?`
      );
      if (!ok) return;
    }

    setPayingId(inst._id);
    try {
      const { data } = await axiosInstance.post(`/installments/${inst._id}/pay-session`);
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start payment.');
      setPayingId(null);
    }
  };

  const handleDownloadInvoice = async (inst) => {
    setDownloadingId(inst._id);
    try {
      const res = await axiosInstance.get(`/installments/${inst._id}/invoice`, {
        responseType: 'blob',
      });
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href     = url;
      link.download = `FlatSell-Installment-${inst.installmentNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Failed to download invoice.');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!open) return null;

  // Roll-up summary
  const paidCount    = installments.filter((i) => i.status === 'paid').length;
  const overdueCount = installments.filter((i) => i.isOverdue).length;
  const totalCount   = installments.length;
  const totalPaid    = installments.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const remaining    = installments
    .filter((i) => i.status !== 'paid')
    .reduce((s, i) => s + i.payableNow, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="glass-card w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Installment Schedule</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {plan
                ? <>{plan.totalCount} installments · {plan.extraChargePercentage}% service charge</>
                : 'Loading plan...'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Stats strip */}
        {!loading && installments.length > 0 && (
          <div className="px-6 py-3 grid grid-cols-4 gap-3 bg-dark-900/40 border-b border-white/8">
            <Stat label="Paid"      value={`${paidCount}/${totalCount}`} color="text-emerald-400" />
            <Stat label="Overdue"   value={overdueCount}                  color={overdueCount > 0 ? 'text-rose-400' : 'text-gray-400'} />
            <Stat label="Total Paid" value={fmt(totalPaid)}                color="text-emerald-400" />
            <Stat label="Remaining" value={fmt(remaining)}                color="text-amber-400" />
          </div>
        )}

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-3" />
              <p className="text-gray-400 text-sm">Loading installments...</p>
            </div>
          ) : installments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-16">
              No installments found for this booking.
            </p>
          ) : (
            installments.map((inst) => {
              const isPaid    = inst.status === 'paid';
              const isOverdue = inst.isOverdue;

              return (
                <div
                  key={inst._id}
                  className={`p-4 rounded-xl border transition-all duration-200
                    ${isPaid
                      ? 'bg-emerald-500/5 border-emerald-500/25'
                      : isOverdue
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : 'bg-dark-800/50 border-white/8'}`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    {/* Left: number + due date */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm
                        ${isPaid
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : isOverdue
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-primary-500/20 text-primary-400'}`}>
                        #{inst.installmentNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">
                          Installment {inst.installmentNumber} of {inst.totalInstallments}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Due: <span className={isOverdue && !isPaid ? 'text-rose-400 font-medium' : 'text-gray-300'}>
                            {fmtDate(inst.dueDate)}
                          </span>
                          {isPaid && inst.paidAt && (
                            <> · Paid: <span className="text-emerald-400">{fmtDate(inst.paidAt)}</span></>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Right: amount + action */}
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{fmt(inst.amountDue)}</p>
                        {isOverdue && !isPaid && (
                          <p className="text-[10px] text-rose-400 font-semibold mt-0.5">
                            + ৳5,000 late fee
                          </p>
                        )}
                        {isPaid && inst.lateFee > 0 && (
                          <p className="text-[10px] text-amber-400 font-semibold mt-0.5">
                            (incl. ৳{inst.lateFee.toLocaleString()} late fee)
                          </p>
                        )}
                      </div>

                      {isPaid ? (
                        <button
                          onClick={() => handleDownloadInvoice(inst)}
                          disabled={downloadingId === inst._id}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold
                                     bg-primary-500/15 text-primary-400 border border-primary-500/25
                                     hover:bg-primary-500/25 hover:border-primary-500/50 transition-all
                                     disabled:opacity-60"
                        >
                          {downloadingId === inst._id ? '...' : '📥 Invoice'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePay(inst)}
                          disabled={payingId === inst._id}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm
                            ${isOverdue
                              ? 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white'
                              : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white'}
                            disabled:opacity-60`}
                        >
                          {payingId === inst._id ? '...' : `Pay ${fmt(inst.payableNow)}`}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status banners */}
                  {isPaid && (
                    <div className="mt-3 pt-3 border-t border-emerald-500/15 text-[11px] text-emerald-300/80 flex items-center gap-1.5">
                      ✓ Paid · Total {fmt(inst.paidAmount)}
                    </div>
                  )}
                  {!isPaid && isOverdue && (
                    <div className="mt-3 pt-3 border-t border-rose-500/15 text-[11px] text-rose-300 flex items-center gap-1.5">
                      ⚠️ This installment is past its due date (the 15th). A ৳5,000 late fee will be added at payment.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-dark-900/40 flex justify-end">
          <button onClick={onClose} className="btn-secondary px-5 py-2 text-sm">Close</button>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color }) => (
  <div>
    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
    <p className={`text-sm font-bold ${color}`}>{value}</p>
  </div>
);

export default InstallmentListModal;
