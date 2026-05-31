import React from 'react';
import { Link } from 'react-router-dom';

const BookingItemCard = ({
  booking: b,
  settings,
  payingDue,
  refunding,
  handleDuePayment,
  handleRequestRefund,
  handleDownloadInvoice,
  setSetupBooking,
  setListBookingId,
  monthsSince,
  daysSince,
  formatCurrency,
  statusColors,
  paymentConfig,
  refundSteps,
}) => {
  const paymentCfg     = paymentConfig[b.paymentStatus] || paymentConfig.unpaid;
  const bookingAmount  = b.bookingAmount || 0;
  const totalPrice     = b.totalPrice || 0;
  const dueAmount      = totalPrice - bookingAmount;
  const isCancelled    = b.status === 'cancelled';
  const isBookingPaid  = b.paymentStatus === 'booking_paid' || b.paymentStatus === 'paid';
  const isFullyPaid    = b.paymentStatus === 'fully_paid';
  const hasInstallPlan = !!b.installmentPlan?.active;
  // "Pay Due" lump-sum is only available when no installment plan is active
  const showDueBtn     = !isCancelled && isBookingPaid && dueAmount > 0 && !hasInstallPlan;
  // "Set Installment" only available when booking paid, dues remain, and no plan yet
  const showSetupBtn   = !isCancelled && isBookingPaid && dueAmount > 0 && !hasInstallPlan && !isFullyPaid;
  // "Pay Installment" replaces the due button once a plan is active
  const showPayInstallBtn = !isCancelled && hasInstallPlan && !isFullyPaid;

  // ── Policy 1: inactivity warning (client-side mirror of the cron) ──
  const warnMonths     = settings?.inactivityWarnMonths ?? 2;
  const cancelMonths   = settings?.inactivityCancelMonths ?? 3;
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
    <div className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
      
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
            <Link
              to={`/property/${b.propertyId?._id}`}
              className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors truncate"
            >
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
                <span
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border
                                   bg-blue-500/15 text-blue-300 border-blue-500/30"
                >
                  📅 {b.installmentPlan.totalCount}-Installment Plan
                </span>
              )}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusColors[b.status]}`}>
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
                {b.retentionAmount > 0 && (
                  <> · Retained <span className="text-amber-600 font-semibold">{formatCurrency(b.retentionAmount)}</span></>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {refundSteps.map((step, i) => {
                const activeIdx = refundSteps.indexOf(refundStatus === 'rejected' ? 'pending' : refundStatus);
                const done = i <= activeIdx;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`flex-1 h-1.5 rounded-full ${done ? 'bg-emerald-500' : 'bg-blue-50'}`} />
                    <span className={`mx-1 text-[10px] capitalize ${done ? 'text-emerald-600' : 'text-gray-500'}`}>
                      {step}
                    </span>
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
};

export default BookingItemCard;
