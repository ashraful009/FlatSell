import { useState, useEffect } from 'react';
import axiosInstance from '../../shared/lib/axiosInstance';

const STATUS_COLORS = {
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20  text-red-400  border-red-500/30',
  pending:  'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

/**
 * PropertyRequests — Super Admin review queue for pending properties
 * Also usable in Company Admin dashboard to see own properties with status
 */
const PropertyRequests = ({ mode = 'admin' }) => {
  const [properties, setProperties] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [action,     setAction]     = useState({}); // { [id]: 'approving' | 'rejecting' }
  const [rejectModal, setRejectModal] = useState(null); // { id, reason }

  const endpoint = mode === 'admin' ? '/properties/pending' : '/properties/my';

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await axiosInstance.get(endpoint);
        setProperties(data.data.properties);
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [endpoint]);

  const handleStatus = async (id, status, reason = '') => {
    setAction((prev) => ({ ...prev, [id]: status }));
    try {
      await axiosInstance.put(`/properties/${id}/status`, {
        status,
        rejectedReason: reason,
      });
      // Optimistic update
      if (mode === 'admin') {
        setProperties((prev) => prev.filter((p) => p._id !== id));
      } else {
        setProperties((prev) =>
          prev.map((p) => (p._id === id ? { ...p, status } : p))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setAction((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setRejectModal(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 flex gap-4 items-center">
            <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-1/2" />
              <div className="skeleton-text w-1/3 h-3" />
            </div>
            <div className="skeleton w-20 h-8 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="glass-card py-14 text-center">
        <p className="text-4xl mb-3">{mode === 'admin' ? '✅' : '📭'}</p>
        <p className="text-white font-medium">
          {mode === 'admin' ? 'No pending properties' : 'No properties yet'}
        </p>
        <p className="text-gray-400 text-sm mt-1">
          {mode === 'admin'
            ? 'All caught up! New submissions will appear here.'
            : 'Submit your first property from the Add Property section.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {properties.map((p) => {
          const cover = p.images?.[0];
          const isActing = !!action[p._id];

          return (
            <div key={p._id}
              className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4
                         hover:border-white/20 transition-colors">

              {/* Cover image */}
              <div className="w-full sm:w-16 h-32 sm:h-16 rounded-xl overflow-hidden
                              bg-dark-800 flex-shrink-0">
                {cover ? (
                  <img src={cover} alt={p.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24"
                         stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2
                           2 0 012.828 0L20 14" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  {p.city} · {p.category} · ৳{p.price?.toLocaleString()}
                </p>
                {p.companyId && (
                  <p className="text-primary-400 text-xs mt-0.5">
                    {p.companyId.name}
                  </p>
                )}
                {p.addedBy && (
                  <p className="text-gray-500 text-xs">by {p.addedBy.name}</p>
                )}
                {/* Status badge (for company admin view) */}
                {mode !== 'admin' && (
                  <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-lg
                                   border font-medium ${STATUS_COLORS[p.status]}`}>
                    {p.status}
                  </span>
                )}
                {p.rejectedReason && (
                  <p className="text-red-400 text-xs mt-1">
                    Reason: {p.rejectedReason}
                  </p>
                )}
              </div>

              {/* Actions (admin mode only) */}
              {mode === 'admin' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStatus(p._id, 'approved')}
                    disabled={isActing}
                    className="px-3 py-1.5 bg-green-500/15 border border-green-500/30
                               text-green-400 hover:bg-green-500/25 text-xs font-semibold
                               rounded-lg transition-colors disabled:opacity-50"
                  >
                    {action[p._id] === 'approved' ? '...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: p._id, reason: '' })}
                    disabled={isActing}
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/30
                               text-red-400 hover:bg-red-500/20 text-xs font-semibold
                               rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✕ Reject
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Reject Reason Modal ──────────────────────────────────────────── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4
                        bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-card p-6 animate-slideUp">
            <h3 className="text-white font-semibold mb-4">Reason for Rejection</h3>
            <textarea
              rows={3}
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((m) => ({ ...m, reason: e.target.value }))}
              className="form-input resize-none mb-4"
              placeholder="Provide a reason for the vendor (optional)..."
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal(null)}
                className="btn-secondary flex-1 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatus(rejectModal.id, 'rejected', rejectModal.reason)}
                className="flex-1 px-4 py-2.5 bg-red-500/15 border border-red-500/30
                           text-red-400 hover:bg-red-500/25 text-sm font-semibold
                           rounded-xl transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PropertyRequests;
