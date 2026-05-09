import { useState, useEffect, useCallback } from 'react';
import axiosInstance    from '../../shared/lib/axiosInstance';
import EditPropertyModal from './EditPropertyModal';

// ─────────────────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  pending:  'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
};

const STATUS_ICON = {
  pending:  '⏳',
  approved: '✅',
  rejected: '❌',
};

const CATEGORY_ICONS = {
  Apartments: '🏢', Villas: '🏡', Land: '🌾',
};

// ─────────────────────────────────────────────────────────────────────────────
// ManageProperties
// mode = 'company' → shows only own properties (GET /properties/my)
// mode = 'admin'   → shows ALL properties (GET /properties/all)
// ─────────────────────────────────────────────────────────────────────────────
const ManageProperties = ({ mode = 'company' }) => {
  const [properties,   setProperties]   = useState([]);
  const [filtered,     setFiltered]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [processing,   setProcessing]   = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [search,       setSearch]       = useState('');

  const endpoint = mode === 'admin' ? '/properties/all' : '/properties/my';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(endpoint);
      const list = data.data.properties || [];
      setProperties(list);
      setFiltered(list);
    } catch {
      setProperties([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // ── Filters ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let result = [...properties];
    if (filterStatus !== 'all') result = result.filter((p) => p.status === filterStatus);
    if (filterActive === 'active')   result = result.filter((p) => p.isActive !== false);
    if (filterActive === 'inactive') result = result.filter((p) => p.isActive === false);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.title?.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  }, [properties, filterStatus, filterActive, search]);

  // ── Toggle Active ──────────────────────────────────────────────────────────
  const handleToggleActive = async (id) => {
    setProcessing((p) => ({ ...p, [id]: 'toggling' }));
    try {
      const { data } = await axiosInstance.patch(`/properties/${id}/active`);
      setProperties((prev) =>
        prev.map((p) => p._id === id ? { ...p, isActive: data.data.isActive } : p)
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Toggle failed');
    } finally {
      setProcessing((p) => { const c = { ...p }; delete c[id]; return c; });
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    setProcessing((p) => ({ ...p, [id]: 'deleting' }));
    try {
      await axiosInstance.delete(`/properties/${id}`);
      setProperties((prev) => prev.filter((p) => p._id !== id));
      setDeleteTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setProcessing((p) => { const c = { ...p }; delete c[id]; return c; });
    }
  };

  // ── After edit ────────────────────────────────────────────────────────────
  const handleUpdated = (updated) => {
    setProperties((prev) =>
      prev.map((p) => p._id === updated._id ? updated : p)
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Skeleton
  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-3">
        {[1,2,3,4].map((i) => (
          <div key={i} className="glass-card p-4 flex gap-4 items-center">
            <div className="skeleton w-16 h-16 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-text w-1/2" />
              <div className="skeleton-text w-1/3 h-3" />
            </div>
            <div className="skeleton w-24 h-8 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Filters & Search ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or city..."
            className="form-input pl-9"
          />
        </div>

        {/* Status filter */}
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="form-input sm:w-40">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Active filter */}
        <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)}
          className="form-input sm:w-40">
          <option value="all">All Visibility</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Refresh */}
        <button onClick={fetchProperties}
          className="btn-secondary px-4 text-sm whitespace-nowrap">
          ↻ Refresh
        </button>
      </div>

      {/* ── Stats Bar ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',    count: properties.length,                              color: 'text-white'        },
          { label: 'Approved', count: properties.filter(p=>p.status==='approved').length, color: 'text-green-400' },
          { label: 'Pending',  count: properties.filter(p=>p.status==='pending').length,  color: 'text-amber-400' },
          { label: 'Active',   count: properties.filter(p=>p.isActive!==false).length,    color: 'text-primary-400'},
        ].map(({ label, count, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Empty state ────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="glass-card py-16 text-center">
          <span className="text-5xl block mb-3">📭</span>
          <p className="text-white font-semibold text-lg">No properties found</p>
          <p className="text-gray-400 text-sm mt-1">
            {search || filterStatus !== 'all' || filterActive !== 'all'
              ? 'Try adjusting your filters.'
              : 'No properties have been added yet.'}
          </p>
        </div>
      )}

      {/* ── Property List ──────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((p) => {
          const isProcessing = !!processing[p._id];
          const isInactive   = p.isActive === false;

          return (
            <div key={p._id}
              className={`glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4
                transition-all duration-200 hover:border-white/20
                ${isInactive ? 'opacity-60' : ''}`}>

              {/* Cover */}
              <div className="w-full sm:w-16 h-28 sm:h-16 rounded-xl overflow-hidden
                              bg-dark-800 flex-shrink-0">
                {p.mainImage || p.images?.[0] ? (
                  <img src={p.mainImage || p.images[0]} alt={p.title}
                    className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    {CATEGORY_ICONS[p.category] || '🏢'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="text-white font-semibold text-sm truncate">{p.title}</p>
                  {/* Status badge */}
                  <span className={`${STATUS_BADGE[p.status]} text-xs`}>
                    {STATUS_ICON[p.status]} {p.status}
                  </span>
                  {/* Inactive badge */}
                  {isInactive && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs
                                     font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-xs">
                  {CATEGORY_ICONS[p.category]} {p.category}
                  <span className="mx-1.5 text-gray-600">·</span>
                  📍 {p.city}
                  <span className="mx-1.5 text-gray-600">·</span>
                  ৳{p.price?.toLocaleString()}
                </p>
                {p.companyId && mode === 'admin' && (
                  <p className="text-primary-400 text-xs mt-0.5">{p.companyId.name}</p>
                )}
                {p.totalFloors && (
                  <p className="text-gray-600 text-xs mt-0.5">
                    {p.totalFloors} floors · {p.unitsPerFloor} units/floor
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap sm:flex-nowrap">

                {/* Active / Inactive toggle */}
                <button
                  onClick={() => handleToggleActive(p._id)}
                  disabled={isProcessing}
                  title={isInactive ? 'Activate' : 'Deactivate'}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300
                    flex items-center px-0.5
                    ${isInactive
                      ? 'bg-gray-600/40 border border-gray-500/40'
                      : 'bg-green-500/30 border border-green-500/40'
                    } disabled:opacity-50`}
                >
                  <span className={`w-5 h-5 rounded-full shadow transition-transform duration-300
                    ${isInactive ? 'translate-x-0 bg-gray-400' : 'translate-x-6 bg-green-400'}`} />
                </button>
                <span className="text-xs text-gray-500 hidden sm:block">
                  {isInactive ? 'Inactive' : 'Active'}
                </span>

                {/* Edit */}
                <button
                  onClick={() => setEditTarget(p)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-primary-500/15 border border-primary-500/30
                             text-primary-400 hover:bg-primary-500/25 text-xs font-semibold
                             rounded-lg transition-colors disabled:opacity-50">
                  ✏️ Edit
                </button>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(p)}
                  disabled={isProcessing}
                  className="px-3 py-1.5 bg-red-500/10 border border-red-500/30
                             text-red-400 hover:bg-red-500/20 text-xs font-semibold
                             rounded-lg transition-colors disabled:opacity-50">
                  {processing[p._id] === 'deleting' ? '...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Edit Modal ─────────────────────────────────────────────────── */}
      {editTarget && (
        <EditPropertyModal
          property={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* ── Delete Confirmation Modal ──────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4
                        bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm glass-card p-6 animate-slideUp">
            <div className="text-center mb-6">
              <span className="text-5xl block mb-3">⚠️</span>
              <h3 className="text-white font-bold text-lg mb-2">Delete Property?</h3>
              <p className="text-gray-400 text-sm">
                <span className="text-white font-medium">&ldquo;{deleteTarget.title}&rdquo;</span>
                {' '}and all its associated units will be permanently deleted. This cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 text-sm">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTarget._id)}
                disabled={processing[deleteTarget._id] === 'deleting'}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white
                           font-semibold rounded-xl transition-colors text-sm
                           disabled:opacity-50">
                {processing[deleteTarget._id] === 'deleting' ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ManageProperties;
