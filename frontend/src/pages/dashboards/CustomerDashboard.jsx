import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import useAuth from '../../shared/hooks/useAuth';
import { toast } from 'react-hot-toast';
import InstallmentSetupModal from '../../features/installments/InstallmentSetupModal';
import InstallmentListModal  from '../../features/installments/InstallmentListModal';

// Modular Components
import CustomerDashboardHeader from './customer-dashboard/components/CustomerDashboardHeader';
import BookingLimitUsage from './customer-dashboard/components/BookingLimitUsage';
import BookingItemCard from './customer-dashboard/components/BookingItemCard';

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

// Whole months between a date and now
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
      
      {/* Header */}
      <CustomerDashboardHeader user={user} />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">My Bookings</h2>
          <p className="text-gray-500 text-sm">Track the status of your property requests.</p>
        </div>
        {/* Booking Limit Widget */}
        <BookingLimitUsage limit={limit} />
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
          {bookings.map((b) => (
            <BookingItemCard
              key={b._id}
              booking={b}
              settings={settings}
              payingDue={payingDue}
              refunding={refunding}
              handleDuePayment={handleDuePayment}
              handleRequestRefund={handleRequestRefund}
              handleDownloadInvoice={handleDownloadInvoice}
              setSetupBooking={setSetupBooking}
              setListBookingId={setListBookingId}
              monthsSince={monthsSince}
              daysSince={daysSince}
              formatCurrency={formatCurrency}
              statusColors={STATUS_COLORS}
              paymentConfig={PAYMENT_CONFIG}
              refundSteps={REFUND_STEPS}
            />
          ))}
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

      {/* Installment Modals */}
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
