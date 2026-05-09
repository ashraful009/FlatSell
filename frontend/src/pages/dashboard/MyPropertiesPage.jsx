import { useState, useEffect } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

const PAYMENT_STATUS_CONFIG = {
  unpaid:       { label: 'Unpaid',       color: 'text-amber-400',   bg: 'bg-amber-500/15 border-amber-500/30',   icon: '⏳' },
  booking_paid: { label: 'Booking Paid', color: 'text-blue-400',    bg: 'bg-blue-500/15 border-blue-500/30',     icon: '💳' },
  fully_paid:   { label: 'Fully Paid',   color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30',icon: '✅' },
  // Legacy support
  paid:         { label: 'Paid',         color: 'text-emerald-400', bg: 'bg-emerald-500/15 border-emerald-500/30',icon: '✅' },
};

const STATUS_COLORS = {
  pending:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  confirmed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rejected:  'bg-red-500/15 text-red-400 border-red-500/30',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
};

const MyPropertiesPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [payingDue, setPayingDue] = useState(null); // bookingId being processed

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const { data } = await axiosInstance.get('/bookings/my');
      setBookings(data.data.bookings || []);
    } catch (error) {
      toast.error('Failed to load your properties');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle due payment ──────────────────────────────────────────────────
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

  // ── Format currency ────────────────────────────────────────────────────
  const formatCurrency = (amount) => {
    if (!amount || amount <= 0) return '—';
    return `৳${Number(amount).toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass-card p-5 flex items-center gap-4">
            <div className="skeleton w-28 h-28 rounded-xl" />
            <div className="space-y-2 flex-1">
              <div className="skeleton-text w-1/3" />
              <div className="skeleton-text w-1/4 h-3" />
              <div className="skeleton-text w-1/2 h-3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">My Properties</h1>
          <p className="text-gray-400 text-sm mt-1">Properties you have booked or purchased</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <span className="text-5xl block mb-4">📭</span>
          <h3 className="text-lg font-bold text-white mb-2">No Properties Yet</h3>
          <p className="text-gray-400 mb-4">You haven't booked any properties yet.</p>
          <Link to="/properties" className="btn-primary">Browse Properties</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const prop          = booking.propertyId;
            const unit          = booking.unitId;
            const statusColor   = STATUS_COLORS[booking.status] || STATUS_COLORS.pending;
            const paymentCfg    = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || PAYMENT_STATUS_CONFIG.unpaid;
            const bookingAmount = booking.bookingAmount || 0;
            const totalPrice    = booking.totalPrice || 0;
            const dueAmount     = totalPrice - bookingAmount;
            const isBookingPaid = booking.paymentStatus === 'booking_paid' || booking.paymentStatus === 'paid';
            const isFullyPaid   = booking.paymentStatus === 'fully_paid';
            const showDueBtn    = isBookingPaid && dueAmount > 0;

            // Get property image
            const propImage = prop?.mainImage || (prop?.galleryImages?.length > 0 ? prop.galleryImages[0] : null);

            return (
              <div key={booking._id} className="glass-card overflow-hidden animate-fadeIn">
                <div className="flex flex-col sm:flex-row">
                  {/* ── Image ────────────────────────────────────────────── */}
                  <div className="w-full sm:w-48 h-48 sm:h-auto relative flex-shrink-0">
                    {propImage ? (
                      <img
                        src={propImage}
                        alt={prop?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-dark-800 flex items-center justify-center text-4xl">
                        {prop?.category === 'villa' ? '🏡' : prop?.category === 'land' ? '🌿' : '🏢'}
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border backdrop-blur-md ${statusColor}`}>
                        {booking.status?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* ── Content ──────────────────────────────────────────── */}
                  <div className="flex-1 p-5 flex flex-col">
                    {/* Title & Location */}
                    <div className="mb-3">
                      <Link to={`/property/${prop?._id}`} className="text-lg font-bold text-white hover:text-primary-400 transition-colors">
                        {prop?.title || 'Unknown Property'}
                      </Link>
                      <p className="text-gray-400 text-xs mt-1">
                        📍 {prop?.address}, {prop?.city}
                      </p>
                    </div>

                    {/* Unit & Company Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {unit?.unitNumber && (
                        <div className="bg-dark-800/50 rounded-lg p-2 border border-white/5">
                          <p className="text-xs text-gray-500">Unit</p>
                          <p className="text-sm font-semibold text-white">{unit.unitNumber}</p>
                        </div>
                      )}
                      {unit?.floor && (
                        <div className="bg-dark-800/50 rounded-lg p-2 border border-white/5">
                          <p className="text-xs text-gray-500">Floor</p>
                          <p className="text-sm font-semibold text-white">{unit.floor}</p>
                        </div>
                      )}
                      <div className="bg-dark-800/50 rounded-lg p-2 border border-white/5">
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="text-sm font-semibold text-white truncate">{booking.companyId?.name || '—'}</p>
                      </div>
                      <div className="bg-dark-800/50 rounded-lg p-2 border border-white/5">
                        <p className="text-xs text-gray-500">Booked</p>
                        <p className="text-sm font-semibold text-white">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* ── Payment Status Section ──────────────────────────── */}
                    <div className="border-t border-white/10 pt-4 mt-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Booking Money */}
                        <div className={`rounded-xl p-3 border ${
                          isBookingPaid || isFullyPaid
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-dark-800/50 border-white/5'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400">Booking Money</p>
                            {(isBookingPaid || isFullyPaid) && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                                ✓ PAID
                              </span>
                            )}
                          </div>
                          <p className={`text-sm font-bold ${
                            isBookingPaid || isFullyPaid ? 'text-emerald-400' : 'text-white'
                          }`}>
                            {formatCurrency(bookingAmount)}
                          </p>
                          {booking.bookingMoneyPercentage && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              {booking.bookingMoneyPercentage}% of total
                            </p>
                          )}
                        </div>

                        {/* Total Price */}
                        <div className="bg-dark-800/50 rounded-xl p-3 border border-white/5">
                          <p className="text-xs text-gray-400 mb-1">Total Price</p>
                          <p className="text-sm font-bold text-white">
                            {formatCurrency(totalPrice)}
                          </p>
                        </div>

                        {/* Due Payment */}
                        <div className={`rounded-xl p-3 border ${
                          isFullyPaid
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : showDueBtn
                              ? 'bg-amber-500/10 border-amber-500/20'
                              : 'bg-dark-800/50 border-white/5'
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400">Due Payment</p>
                            {isFullyPaid && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                                ✓ CLEARED
                              </span>
                            )}
                          </div>

                          {isFullyPaid ? (
                            <p className="text-sm font-bold text-emerald-400">৳0</p>
                          ) : showDueBtn ? (
                            <button
                              onClick={() => handleDuePayment(booking._id)}
                              disabled={payingDue === booking._id}
                              className="mt-0.5 w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500
                                         text-white text-xs font-bold hover:from-amber-600 hover:to-orange-600
                                         transition-all duration-200 flex items-center justify-center gap-1.5
                                         shadow-[0_2px_10px_rgba(245,158,11,0.25)]
                                         disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {payingDue === booking._id ? (
                                <>
                                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                <>💳 Pay {formatCurrency(dueAmount)}</>
                              )}
                            </button>
                          ) : (
                            <p className="text-sm font-bold text-gray-400">
                              {dueAmount > 0 ? formatCurrency(dueAmount) : '—'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Overall payment status badge */}
                      <div className="flex items-center justify-between mt-3">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${paymentCfg.bg} ${paymentCfg.color}`}>
                          {paymentCfg.icon} {paymentCfg.label}
                        </span>
                        <Link to={`/property/${prop?._id}`} className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPropertiesPage;
