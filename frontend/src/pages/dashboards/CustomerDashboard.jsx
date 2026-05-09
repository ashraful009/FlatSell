import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import useAuth from '../../shared/hooks/useAuth';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending:   'bg-amber-500/20  text-amber-400  border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected:  'bg-red-500/20    text-red-400    border-red-500/30',
  cancelled: 'bg-gray-500/20   text-gray-400   border-gray-500/30',
};

const PAYMENT_CONFIG = {
  unpaid:       { label: 'Unpaid',       color: 'text-amber-400',   icon: '⏳' },
  booking_paid: { label: 'Booking Paid', color: 'text-blue-400',    icon: '💳' },
  fully_paid:   { label: 'Fully Paid',   color: 'text-emerald-400', icon: '✅' },
  paid:         { label: 'Paid',         color: 'text-emerald-400', icon: '✅' },
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [payingDue, setPayingDue] = useState(null);

  useEffect(() => {
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
    fetchBookings();
  }, []);

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
          <h1 className="text-2xl font-bold text-white mb-1">My Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/customer-dashboard/my-properties" className="btn-primary flex items-center h-10 px-4 text-sm font-semibold">
            My Properties
          </Link>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800
                          flex items-center justify-center text-white text-xl font-bold border-2 border-white/10">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">My Bookings</h2>
        <p className="text-gray-400 text-sm">Track the status of your property requests.</p>
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
            const paymentCfg    = PAYMENT_CONFIG[b.paymentStatus] || PAYMENT_CONFIG.unpaid;
            const bookingAmount = b.bookingAmount || 0;
            const totalPrice    = b.totalPrice || 0;
            const dueAmount     = totalPrice - bookingAmount;
            const isBookingPaid = b.paymentStatus === 'booking_paid' || b.paymentStatus === 'paid';
            const isFullyPaid   = b.paymentStatus === 'fully_paid';
            const showDueBtn    = isBookingPaid && dueAmount > 0;

            // Get property image
            const propImage = b.propertyId?.mainImage || (b.propertyId?.galleryImages?.length > 0 ? b.propertyId.galleryImages[0] : null);

            return (
              <div key={b._id} className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
                
                {/* Image */}
                <div className="w-full sm:w-32 h-40 sm:h-auto rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
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
                    <div className="flex justify-between items-start mb-2">
                      <Link to={`/property/${b.propertyId?._id}`} className="text-lg font-bold text-white hover:text-primary-400 transition-colors truncate">
                        {b.propertyId?.title || 'Unknown Property'}
                      </Link>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[b.status]}`}>
                        {b.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {b.unitId?.floor && <span className="font-medium text-gray-300">Floor {b.unitId.floor}</span>}
                      {b.unitId?.unitNumber && <>, Unit {b.unitId.unitNumber}</>}
                      {b.unitId?.type && <> · {b.unitId.type}</>}
                    </p>
                  </div>
                  
                  {/* ── Payment & Info Grid ──────────────────────────────── */}
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-6 gap-y-2 text-xs">
                      <div>
                        <p className="text-gray-500 mb-0.5">Company</p>
                        <p className="text-gray-300">{b.companyId?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Booking Money</p>
                        <p className={`font-semibold ${isBookingPaid || isFullyPaid ? 'text-emerald-400' : 'text-gray-300'}`}>
                          {formatCurrency(bookingAmount)}
                          {(isBookingPaid || isFullyPaid) && <span className="text-[10px] ml-1">✓</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Total Price</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(totalPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Due</p>
                        {isFullyPaid ? (
                          <p className="text-emerald-400 font-semibold">৳0 ✓</p>
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
                          <p className="text-amber-400 font-semibold">
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

                  {/* ── Download Invoice ────────────────────────────────── */}
                  {(isBookingPaid || isFullyPaid) && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => handleDownloadInvoice(b._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                                   bg-primary-500/15 text-primary-400 border border-primary-500/25
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
          <h3 className="text-lg font-bold text-white mb-2">No Bookings Found</h3>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">
            You haven&apos;t requested any units yet. Browse properties and find your perfect home!
          </p>
          <Link to="/properties" className="btn-primary inline-flex">
            Browse Properties
          </Link>
        </div>
      )}
    </div>
  );
};

export default CustomerDashboard;
