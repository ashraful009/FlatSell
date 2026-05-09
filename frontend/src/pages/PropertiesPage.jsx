import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../shared/lib/axiosInstance';
import PropertyCard from '../shared/components/PropertyCard';
import PropertyCardSkeleton from '../shared/components/PropertyCardSkeleton';

const CATEGORIES = [
  { value: '', label: 'All Types' },
  { value: 'apartment',  label: '🏢 Apartments'  },
  { value: 'villa',      label: '🏡 Villas'       },
  { value: 'land',       label: '🌿 Land'         },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First'       },
  { value: 'price-asc',  label: 'Price: Low → High'  },
  { value: 'price-desc', label: 'Price: High → Low'  },
];

const LIMIT = 12;

// ─────────────────────────────────────────────────────────────────────────────
const PropertiesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filters from URL
  const [city,     setCity]     = useState(searchParams.get('city')     || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort,     setSort]     = useState(searchParams.get('sort')     || 'newest');
  const [page,     setPage]     = useState(Number(searchParams.get('page')) || 1);

  const [properties, setProperties] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync search params to URL
  const applyFilters = useCallback((newFilters = {}) => {
    const merged = { city, category, sort, page: 1, ...newFilters };
    const params = {};
    if (merged.city)     params.city     = merged.city;
    if (merged.category) params.category = merged.category;
    if (merged.sort && merged.sort !== 'newest') params.sort = merged.sort;
    if (merged.page > 1) params.page = merged.page;
    setSearchParams(params);
    setCity(merged.city || '');
    setCategory(merged.category || '');
    setSort(merged.sort || 'newest');
    setPage(Number(merged.page) || 1);
  }, [city, category, sort, page, setSearchParams]);

  // Fetch properties whenever filters change
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setProperties([]);
    try {
      const q = new URLSearchParams({ limit: LIMIT, page });
      if (city)     q.set('city', city);
      if (category) q.set('category', category);

      const { data } = await axiosInstance.get(`/properties/approved?${q}`);
      let props = data.data.properties;

      // Client-side sort (backend sort parameter can be added in Phase 9+)
      if (sort === 'price-asc')  props = [...props].sort((a, b) => a.price - b.price);
      if (sort === 'price-desc') props = [...props].sort((a, b) => b.price - a.price);

      setProperties(props);
      setTotal(data.data.total);
    } catch {
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [city, category, sort, page]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const totalPages = Math.ceil(total / LIMIT);

  // ── Filter sidebar content ─────────────────────────────────────────────────
  const FilterContent = () => (
    <div className="space-y-6">
      {/* City search */}
      <div>
        <label className="form-label">City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters({ city: e.target.value })}
          className="form-input"
          placeholder="e.g. Dhaka"
        />
      </div>

      {/* Category */}
      <div>
        <label className="form-label">Property Type</label>
        <div className="space-y-1.5 mt-2">
          {CATEGORIES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => applyFilters({ category: value })}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all
                ${category === value
                  ? 'bg-primary-500/20 border border-primary-500/40 text-primary-300 font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="form-label">Sort By</label>
        <select
          value={sort}
          onChange={(e) => applyFilters({ sort: e.target.value })}
          className="form-input mt-1"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Clear all */}
      {(city || category || sort !== 'newest') && (
        <button
          onClick={() => applyFilters({ city: '', category: '', sort: 'newest', page: 1 })}
          className="w-full py-2 text-sm text-red-400 hover:text-red-300
                     hover:bg-red-500/10 rounded-xl transition-colors"
        >
          ✕ Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900 py-8">
      <div className="container-main">

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-gray-300">Properties</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div>
              <h1 className="section-title mb-1">
                {category
                  ? `${category.charAt(0).toUpperCase() + category.slice(1)}s`
                  : 'All Properties'}
                {city && <span className="text-gray-400 font-normal"> in {city}</span>}
              </h1>
              {!loading && (
                <p className="text-gray-400 text-sm">
                  {total} {total === 1 ? 'property' : 'properties'} found
                </p>
              )}
            </div>

            {/* Mobile filter button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="sm:hidden flex items-center gap-2 btn-secondary text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0
                     01-1.447.894l-4-2A1 1 0 017 17v-3.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {(city || category || sort !== 'newest') && (
                <span className="w-2 h-2 bg-primary-400 rounded-full" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-6">

          {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
          <aside className="hidden sm:block w-56 flex-shrink-0">
            <div className="glass-card p-5 sticky top-20">
              <h2 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">
                Filters
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* ── Main content ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Apply button */}
            <div className="hidden sm:flex justify-end mb-4 gap-3">
              <button onClick={() => applyFilters()} className="btn-primary text-sm py-2">
                Apply Filters
              </button>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(LIMIT)].map((_, i) => <PropertyCardSkeleton key={i} />)}
              </div>
            ) : properties.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {properties.map((p) => <PropertyCard key={p._id} property={p} />)}
              </div>
            ) : (
              <div className="glass-card py-20 text-center">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white font-semibold mb-1">No properties found</p>
                <p className="text-gray-400 text-sm mb-5">
                  Try adjusting your filters or clearing them.
                </p>
                <button
                  onClick={() => applyFilters({ city: '', category: '', sort: 'newest', page: 1 })}
                  className="btn-secondary text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* ── Pagination ─────────────────────────────────────────────── */}
            {totalPages > 1 && !loading && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => applyFilters({ page: page - 1 })}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300
                             hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-all text-sm"
                >
                  ← Prev
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                  const p = i + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => applyFilters({ page: p })}
                      className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                        ${page === p
                          ? 'bg-primary-500 text-white border border-primary-500'
                          : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}

                <button
                  onClick={() => applyFilters({ page: page + 1 })}
                  disabled={page >= totalPages}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300
                             hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                             transition-all text-sm"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ──────────────────────────────────────────── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 sm:hidden animate-fadeIn"
             onClick={(e) => e.target === e.currentTarget && setMobileFilterOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute bottom-0 left-0 right-0 glass-card rounded-t-3xl
                          p-6 pb-10 max-h-[80vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold">Filters</h2>
              <button onClick={() => setMobileFilterOpen(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterContent />
            <button
              onClick={() => { applyFilters(); setMobileFilterOpen(false); }}
              className="btn-primary w-full mt-6"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
