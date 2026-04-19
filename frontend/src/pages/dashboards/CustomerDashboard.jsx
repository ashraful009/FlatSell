import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../shared/lib/axiosInstance';
import useAuth from '../../shared/hooks/useAuth';

const STATUS_COLORS = {
  pending:   'bg-amber-500/20  text-amber-400  border-amber-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  rejected:  'bg-red-500/20    text-red-400    border-red-500/30',
  cancelled: 'bg-gray-500/20   text-gray-400   border-gray-500/30',
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

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

  return (
    <div className="container-main py-10 min-h-screen">
      
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 sm:p-8 mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back, {user?.name}</p>
        </div>
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-600 to-primary-800
                        flex items-center justify-center text-white text-xl font-bold border-2 border-white/10">
          {user?.name?.charAt(0).toUpperCase()}
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
          {bookings.map((b) => (
            <div key={b._id} className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
              
              {/* Image */}
              <div className="w-full sm:w-32 h-40 sm:h-auto rounded-xl bg-dark-800 overflow-hidden flex-shrink-0">
                {b.propertyId?.images?.[0] ? (
                  <img src={b.propertyId.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
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
                    <span className="font-medium text-gray-300">Floor {b.unitId?.floor}</span>, Unit {b.unitId?.unitNumber} · {b.unitId?.type}
                  </p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                  <div>
                    <p className="text-gray-500 mb-0.5">Company</p>
                    <p className="text-gray-300">{b.companyId?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Contact</p>
                    <p className="text-gray-300">{b.companyId?.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Price</p>
                    <p className="text-primary-400 font-semibold">
                      ৳{b.unitId?.price ? b.unitId.price.toLocaleString() : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-0.5">Payment</p>
                    <p className={`font-semibold ${b.paymentStatus === 'paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {b.paymentStatus.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
