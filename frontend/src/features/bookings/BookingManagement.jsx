import { useState, useEffect } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';
import { toast } from 'react-hot-toast';

const STATUS_COLORS = {
  pending:   'bg-amber-500/20  text-amber-400  border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected:  'bg-red-500/20    text-red-400    border-red-500/30',
  cancelled: 'bg-gray-500/20   text-gray-400   border-gray-500/30',
};

const BookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await axiosInstance.get('/bookings/company');
        setBookings(data.data.bookings);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axiosInstance.put(`/bookings/${id}/status`, { status });
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status } : b)));
      toast.success(`Booking ${status} successfully`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  if (loading) return <div className="text-gray-400 py-10 text-center">Loading bookings...</div>;

  if (bookings.length === 0) {
    return (
      <div className="glass-card py-20 text-center">
        <p className="text-4xl mb-4">📭</p>
        <p className="text-white font-medium">No Bookings Yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((b) => (
        <div key={b._id} className="glass-card p-5 border-l-4" 
             style={{ borderLeftColor: b.status === 'pending' ? '#f59e0b' : b.status === 'confirmed' ? '#10b981' : '#6b7280' }}>
          
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-white">{b.propertyId?.title || 'Unknown Property'}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${STATUS_COLORS[b.status]}`}>
                  {b.status.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-1">
                <span className="text-gray-500">Unit:</span> {b.unitId?.unitNumber} (Floor {b.unitId?.floor})
              </p>
              <p className="text-sm text-gray-300 mb-1">
                <span className="text-gray-500">Customer:</span> {b.customerId?.name} ({b.customerId?.phone})
              </p>
              <p className="text-sm text-gray-300">
                <span className="text-gray-500">Email:</span> {b.customerId?.email}
              </p>
              
              {b.message && (
                <div className="mt-3 p-3 bg-dark-900/50 rounded-lg text-sm text-gray-400 italic font-light">
                  &ldquo;{b.message}&rdquo;
                </div>
              )}
            </div>

            {/* Actions for Pending bookings */}
            {b.status === 'pending' && (
              <div className="flex sm:flex-col gap-2 flex-shrink-0">
                <button 
                  onClick={() => handleStatusUpdate(b._id, 'confirmed')}
                  className="btn-primary text-xs py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 border-none">
                  Confirm Booking
                </button>
                <button 
                  onClick={() => handleStatusUpdate(b._id, 'rejected')}
                  className="btn-secondary text-xs py-1.5 px-3 text-red-400 hover:text-red-300">
                  Reject
                </button>
              </div>
            )}
            {/* If confirmed, might want an option to cancel if buyer backs out */}
            {b.status === 'confirmed' && (
               <div className="flex sm:flex-col justify-end">
                 <button 
                  onClick={() => handleStatusUpdate(b._id, 'cancelled')}
                  className="text-xs text-red-400 hover:underline">
                  Cancel Booking
                </button>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BookingManagement;
