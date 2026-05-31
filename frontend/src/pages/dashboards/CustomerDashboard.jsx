import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import useAuth from '../../shared/hooks/useAuth';
import { toast } from 'react-hot-toast';
import InstallmentSetupModal from '../../features/installments/InstallmentSetupModal';
import InstallmentListModal  from '../../features/installments/InstallmentListModal';

const STATUS_COLORS = {
  pending:   'bg-amber-500/20  text-amber-600  border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30',
  rejected:  'bg-red-500/20    text-red-600    border-red-500/30',
  cancelled: 'bg-gray-500/20   text-gray-500   border-gray-500/30',
};

const PAYMENT_CONFIG = {
  unpaid:       { label: 'Unpaid',       color: 'text-amber-600',   icon: '⏳' },
  booking_paid: { label: 'Booking Paid', color: 'text-blue-600',    icon: '💳' },
  fully_paid:   { label: 'Fully Paid',   color: 'text-emerald-600', icon: '✅' },
  paid:         { label: 'Paid',         color: 'text-emerald-600', icon: '✅' },
};

// Whole months between a date and now (mirrors backend dateUtils.monthsBetween)
const monthsSince = (from) => {
  if (!from) return 0;
  const a = new Date(from);
  const b = new Date();
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return Math.max(0, m);
};
const daysSince = (from) => {
  if (!from) return 0;
  return Math.floor((Date.now() - new Date(from).getTime()) / 86_400_000);
};

const REFUND_STEPS = ['pending', 'approved', 'completed'];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [payingDue, setPayingDue] = useState(null);
  const [refunding, setRefunding] = useState(null); // bookingId being refunded

  // Policy settings + booking-limit usage
  const [settings, setSettings] = useState(null);
  const [limit, setLimit]       = useState(null);

  // Installment modals
  const [setupBooking, setSetupBooking] = useState(null);  // booking object → opens setup modal
  const [listBookingId, setListBookingId] = useState(null); // bookingId → opens list modal

  const fetchBookings = async () => {
    try {
      const { data } = await axiosInstance.get('/bookings/my');
      setBookings(data.data.bookings);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicyInfo = async () => {
    try {
      const [settingsRes, limitRes] = await Promise.all([
        axiosInstance.get('/settings/public'),
        axiosInstance.get('/bookings/limit-check'),
      ]);
      setSettings(settingsRes.data.data.settings);
      setLimit(limitRes.data.data);
    } catch {
      /* non-fatal */
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchPolicyInfo();
  }, []);

  const handleRequestRefund = async (bookingId) => {
    if (!window.confirm('Request a refund for this booking? Your booking will be cancelled and a retention fee applies.')) return;
    setRefunding(bookingId);
    try {
      const { data } = await axiosInstance.post(`/bookings/${bookingId}/request-refund`);
      toast.success(data.message || 'Refund requested');
      await Promise.all([fetchBookings(), fetchPolicyInfo()]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request refund');
    } finally {
      setRefunding(null);
    }
  };

  const handleDuePayment = async (bookingId) => {
    setPayingDue(bookingId);
    try {
      const { data } = await axiosInstance.post('/checkout/create-due-session', { bookingId });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to initialize due payment');
      setPayingDue(null);
    }
  };

  const handleDownloadInvoice = async (bookingId) => {
    try {
      const res = await axiosInstance.get(`/bookings/${bookingId}/invoice`, {
        responseType: 'blob',
      });
      const url     = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link    = document.createElement('a');
      link.href     = url;
      link.download = `FlatSell-Invoice-${bookingId.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Invoice downloaded!');
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount <= 0) return '—';
    return `৳${Number(amount).toLocaleString()}`;
  };

  return (
    <div className="container-main py-10 min-h-screen">
      
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/customer-dashboard/my-properties" className="btn-primary flex items-center h-10 px-4 text-sm font-semibold">
            My Properties
          </Link>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800
                          flex items-center justify-center text-white text-xl font-bold border-2 border-blue-100">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-gray-500 text-sm">Track the status of your property requests.</p>
        </div>
        {limit && (
          <div className="text-right">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-blue-100">
              <span className="text-sm text-gray-600">Active bookings</span>
              <span className={`text-sm font-bold ${limit.totalActive >= limit.totalLimit ? 'text-red-600' : 'text-primary-600'}`}>
                {limit.totalActive} of {limit.totalLimit} used
              </span>
            </div>
            {limit.totalActive >= limit.totalLimit && (
              <p className="text-xs text-amber-600 mt-1">
                Limit reached.{' '}
                <a href="mailto:icsteamservice@gmail.com?subject=Booking%20Limit%20Override%20Request" className="underline">
                  Contact Super Admin
                </a>{' '}
                to book more.
              </p>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card p-5 flex items-center gap-4">
              <div className="skeleton w-20 h-20 rounded-xl" />
              <div className="space-y-2 flex-1">
                <div className="skeleton-text w-1/3" />
                <div className="skeleton-text w-1/4 h-3" />
              </div>
            </div>
          ))}
        </div>
      ) : bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((b) => {
            const paymentCfg     = PAYMENT_CONFIG[b.paymentStatus] || PAYMENT_CONFIG.unpaid;
            const bookingAmount  = b.bookingAmount || 0;
            const totalPrice     = b.totalPrice || 0;
            const dueAmount      = totalPrice - bookingAmount;
            const isBookingPaid  = b.paymentStatus === 'booking_paid' || b.paymentStatus === 'paid';
            const isFullyPaid    = b.paymentStatus === 'fully_paid';
            const hasInstallPlan = !!b.installmentPlan?.active;
            // "Pay Due" lump-sum is only available when no installment plan is active
            const showDueBtn     = isBookingPaid && dueAmount > 0 && !hasInstallPlan;
            // "Set Installment" only available when booking paid, dues remain, and no plan yet
            const showSetupBtn   = isBookingPaid && dueAmount > 0 && !hasInstallPlan && !isFullyPaid;
            // "Pay Installment" replaces the due button once a plan is active
            const showPayInstallBtn = hasInstallPlan && !isFullyPaid;

            // ── Policy 1: inactivity warning (client-side mirror of the cron) ──
            const warnMonths     = settings?.inactivityWarnMonths ?? 2;
            const cancelMonths   = settings?.inactivityCancelMonths ?? 3;
            const isCancelled    = b.status === 'cancelled';
            const cancelledNoRefund = isCancelled && b.noRefund;
            const isActiveUnsettled = (b.status === 'pending' || b.status === 'confirmed') && !isFullyPaid;
            const inactivityRef =
              b.paymentStatus === 'unpaid'
                ? b.createdAt
                : (hasInstallPlan ? (b.lastPaymentDate || b.installmentPlan?.createdAt || b.createdAt) : null);
            const monthsInactive   = inactivityRef ? monthsSince(inactivityRef) : 0;
            const showInactivityWarn = isActiveUnsettled && !!inactivityRef && monthsInactive >= warnMonths;

            // ── Policy 2: refund eligibility / tracking ───────────────────────
            const refundWindowDays = settings?.refundWindowDays ?? 30;
            const retentionPct     = settings?.refundRetentionPercentage ?? 20;
            const refundStatus     = b.refundStatus || 'none';
            const withinRefundWindow = daysSince(b.createdAt) < refundWindowDays;
            const canRequestRefund = !isCancelled && refundStatus === 'none' && bookingAmount > 0 && withinRefundWindow;
            const refundExpired    = !isCancelled && refundStatus === 'none' && bookingAmount > 0 && !withinRefundWindow;

            // Get property image
            const propImage = b.propertyId?.mainImage || (b.propertyId?.galleryImages?.length > 0 ? b.propertyId.galleryImages[0] : null);

            return (
              <div key={b._id} className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
                
                {/* Image */}
                <div className="w-full sm:w-32 h-40 sm:h-auto rounded-xl bg-white overflow-hidden flex-shrink-0">
                  {propImage ? (
                    <img src={propImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-3xl">
                      {b.propertyId?.category === 'villa' ? '🏡' : b.propertyId?.category === 'land' ? '🌿' : '🏢'}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    {/* Policy 1 — inactivity warning banner */}
                    {showInactivityWarn && (
                      <div className="mb-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
                        <span className="text-amber-600">⚠️</span>
                        <p className="text-amber-300 text-xs leading-relaxed">
                          No payment activity for <strong>{monthsInactive} month{monthsInactive > 1 ? 's' : ''}</strong>.
                          This booking will be <strong>automatically cancelled with no refund</strong> at{' '}
                          {cancelMonths} months of inactivity. Make a payment to keep it.
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <Link to={`/property/${b.propertyId?._id}`} className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors truncate">
                        {b.propertyId?.title || 'Unknown Property'}
                      </Link>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {showSetupBtn && (
                          <button
                            onClick={() => setSetupBooking(b)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold border
                                       bg-primary-500/15 text-primary-600 border-primary-500/30
                                       hover:bg-primary-500/25 hover:border-primary-500/50 transition-all"
                          >
                            📅 Set Installment
                          </button>
                        )}
                        {hasInstallPlan && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border
                                           bg-blue-500/15 text-blue-300 border-blue-500/30">
                            📅 {b.installmentPlan.totalCount}-Installment Plan
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[b.status]}`}>
                          {b.status.toUpperCase()}
                        </span>
                        {cancelledNoRefund && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-red-500/15 text-red-300 border-red-500/40">
                            🚫 NO REFUND
                          </span>
                        )}
                        {isCancelled && b.cancellationReason === 'refund_requested' && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold border bg-blue-500/15 text-blue-300 border-blue-500/40">
                            ↩️ REFUNDED
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mb-3">
                      {b.unitId?.floor && <span className="font-medium text-gray-600">Floor {b.unitId.floor}</span>}
                      {b.unitId?.unitNumber && <>, Unit {b.unitId.unitNumber}</>}
                      {b.unitId?.type && <> · {b.unitId.type}</>}
                    </p>
                  </div>
                  
                  {/* ── Payment & Info Grid ──────────────────────────────── */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <p className="text-gray-500 mb-0.5">Company</p>
                        <p className="text-gray-600">{b.companyId?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Booking Money</p>
                        <p className={`font-semibold ${isBookingPaid || isFullyPaid ? 'text-emerald-600' : 'text-gray-600'}`}>
                          {formatCurrency(bookingAmount)}
                          {(isBookingPaid || isFullyPaid) && <span className="text-[10px] ml-1">✓</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Total Price</p>
                        <p className="text-gray-900 font-semibold">
                          {formatCurrency(totalPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Due</p>
                        {isFullyPaid ? (
                          <p className="text-emerald-600 font-semibold">৳0 ✓</p>
                        ) : showPayInstallBtn ? (
                          <button
                            onClick={() => setListBookingId(b._id)}
                            className="mt-0.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600
                                       text-white text-xs font-bold hover:from-blue-600 hover:to-indigo-700
                                       transition-all duration-200 shadow-sm"
                          >
                            💳 Pay Installment
                          </button>
                        ) : showDueBtn ? (
                          <button
                            onClick={() => handleDuePayment(b._id)}
                            disabled={payingDue === b._id}
                            className="mt-0.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500
                                       text-white text-xs font-bold hover:from-amber-600 hover:to-orange-600
                                       transition-all duration-200 disabled:opacity-60 shadow-sm"
                          >
                            {payingDue === b._id ? '...' : `Pay ${formatCurrency(dueAmount)}`}
                          </button>
                        ) : (
                          <p className="text-amber-600 font-semibold">
                            {dueAmount > 0 ? formatCurrency(dueAmount) : '—'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Payment</p>
                        <p className={`font-semibold ${paymentCfg.color}`}>
                          {paymentCfg.icon} {paymentCfg.label}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ── Policy 2: Refund request / status tracking ───────── */}
                  {refundStatus !== 'none' ? (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-gray-500">Refund Status</p>
                        <p className="text-xs text-gray-600">
                          Refunded <span className="text-emerald-600 font-semibold">{formatCurrency(b.refundAmount)}</span>
                          {b.retentionAmount > 0 && <> · Retained <span className="text-amber-600 font-semibold">{formatCurrency(b.retentionAmount)}</span></>}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {REFUND_STEPS.map((step, i) => {
                          const activeIdx = REFUND_STEPS.indexOf(refundStatus === 'rejected' ? 'pending' : refundStatus);
                          const done = i <= activeIdx;
                          return (
                            <div key={step} className="flex items-center flex-1">
                              <div className={`flex-1 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-blue-50'}`} />
                              <span className={`mx-1 text-[10px] capitalize ${done ? 'text-emerald-600' : 'text-gray-500'}`}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : canRequestRefund ? (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-gray-500">
                        Within refund window · {retentionPct}% retention applies
                      </p>
                      <button
                        onClick={() => handleRequestRefund(b._id)}
                        disabled={refunding === b._id}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border
                                   bg-red-500/10 text-red-300 border-red-500/30
                                   hover:bg-red-500/20 transition-all disabled:opacity-60"
                      >
                        {refunding === b._id ? 'Processing…' : '↩️ Request Refund'}
                      </button>
                    </div>
                  ) : refundExpired ? (
                    <div className="mt-3 pt-3 border-t border-slate-100 text-right">
                      <p className="text-[11px] text-gray-500 italic">Refund period has expired</p>
                    </div>
                  ) : null}

                  {/* ── Download Invoice ────────────────────────────────── */}
                  {(isBookingPaid || isFullyPaid) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDownloadInvoice(b._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                   bg-primary-500/15 text-primary-600 border border-primary-500/25
                                   hover:bg-primary-500/25 hover:border-primary-500/50 transition-all duration-200"
                      >
                        📥 Download Invoice
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card py-20 text-center">
          <span className="text-5xl block mb-4">📭</span>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Bookings Found</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            You haven&apos;t requested any units yet. Browse properties and find your perfect home!
          </p>
          <Link to="/properties" className="btn-primary inline-flex">
            Browse Properties
          </Link>
        </div>
      )}

      {/* ── Installment Modals ──────────────────────────────────────────── */}
      <InstallmentSetupModal
        open={!!setupBooking}
        booking={setupBooking}
        onClose={() => setSetupBooking(null)}
        onSuccess={() => fetchBookings()}
      />
      <InstallmentListModal
        open={!!listBookingId}
        bookingId={listBookingId}
        onClose={() => setListBookingId(null)}
      />
    </div>
  );
};

export default CustomerDashboard;
