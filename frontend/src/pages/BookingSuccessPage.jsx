import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

const CheckCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const XCircleIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

const BookingSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId   = searchParams.get('session_id');
  const paymentType = searchParams.get('type') || 'booking'; // 'booking' or 'due'
  const [status, setStatus] = useState('processing'); // processing, success, error
  const called = useRef(false);

  const isDuePayment = paymentType === 'due';

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const confirmBooking = async () => {
      if (called.current) return;
      called.current = true;
      try {
        await axiosInstance.post('/bookings/confirm', { sessionId });
        setStatus('success');
        toast.success(
          isDuePayment
            ? 'Full payment successful! Property is now yours.'
            : 'Payment successful! Booking confirmed.'
        );
        
        // Redirect to My Properties after a short delay
        setTimeout(() => {
          navigate('/customer-dashboard/my-properties');
        }, 3000);
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
        toast.error(error.response?.data?.message || 'Failed to confirm booking.');
      }
    };

    confirmBooking();
  }, [sessionId, navigate, isDuePayment]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full glass-card p-8 text-center space-y-6">
        {status === 'processing' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white">
              {isDuePayment ? 'Confirming Full Payment...' : 'Confirming Payment...'}
            </h2>
            <p className="text-gray-400 mt-2">Please do not close this window.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-fadeIn">
            <CheckCircleIcon className="h-20 w-20 text-emerald-500 mb-4" />
            <h2 className="text-3xl font-black text-white">
              {isDuePayment ? 'Payment Complete!' : 'Booking Successful!'}
            </h2>
            <p className="text-gray-400 mt-2">
              {isDuePayment
                ? 'Your full payment has been processed. The property is now fully paid and confirmed.'
                : 'Your booking money has been paid and your unit is reserved. You can pay the remaining balance from your dashboard.'}
            </p>

            {/* Payment type badge */}
            <div className={`mt-4 px-4 py-2 rounded-xl border text-sm font-semibold ${
              isDuePayment
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
            }`}>
              {isDuePayment ? '✅ Fully Paid' : '💳 Booking Money Paid'}
            </div>

            <p className="text-sm text-primary-400 mt-4">
              Redirecting to My Properties...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-fadeIn">
            <XCircleIcon className="h-20 w-20 text-red-500 mb-4" />
            <h2 className="text-3xl font-black text-white">Confirmation Failed</h2>
            <p className="text-gray-400 mt-2">
              We could not verify your payment session. If you were charged, please contact support.
            </p>
            <Link to="/" className="btn-primary mt-6">
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingSuccessPage;
