import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import axiosInstance from '../shared/lib/axiosInstance';
import UnitVisualizer from '../features/units/UnitVisualizer';
import UnitDetailModal from '../features/units/UnitDetailModal';

const TABS = ['Overview', 'Floor Plan', 'Location'];

const CATEGORY_ICONS = {
  apartment: '🏢', commercial: '🏬', land: '🌿', villa: '🏡', office: '🏛️',
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const PropertyDetailSkeleton = () => (
  <div className="container-main py-8 animate-pulse">
    <div className="skeleton h-72 sm:h-96 rounded-2xl mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="skeleton-text w-2/3 h-8" />
        <div className="skeleton-text w-1/3 h-4" />
        <div className="skeleton-text w-full" />
        <div className="skeleton-text w-5/6" />
      </div>
      <div className="skeleton h-48 rounded-2xl" />
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const PropertyDetailPage = () => {
  const { id } = useParams();

  const [property,    setProperty]    = useState(null);
  const [unitData,    setUnitData]    = useState({ units: [], grouped: {}, stats: {} });
  const [activeTab,   setActiveTab]   = useState('Overview');
  const [activeImg,   setActiveImg]   = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [selectedUnit, setSelectedUnit] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [propRes, unitRes] = await Promise.all([
          axiosInstance.get(`/properties/${id}`),
          axiosInstance.get(`/units/property/${id}`),
        ]);
        setProperty(propRes.data.data.property);
        setUnitData(unitRes.data.data);
      } catch {
        setError('Property not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <PropertyDetailSkeleton />;

  if (error || !property) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-white font-semibold mb-2">{error}</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">← Back to Home</Link>
      </div>
    );
  }

  const {
    title, description, price, city, address, category,
    mainImage, galleryImages, images, totalFloors, unitsPerFloor, companyId, addedBy, location,
  } = property;

  const allImages = [];
  if (mainImage) allImages.push(mainImage);
  if (galleryImages?.length) allImages.push(...galleryImages);
  if (!allImages.length && images?.length) allImages.push(...images);

  const hasMap = location?.lat && location?.lng;

  return (
    <div className="min-h-screen bg-dark-900 pb-20">
      {/* ── Hero Image Gallery ──────────────────────────────────────────── */}
      <div className="bg-dark-950">
        <div className="container-main pt-6 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/properties" className="hover:text-white transition-colors">Properties</Link>
            <span>/</span>
            <span className="text-gray-300 truncate max-w-xs">{title}</span>
          </nav>

          {allImages.length > 0 ? (
            <>
              {/* Main image */}
              <div className="relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden mb-3">
                <img
                  src={allImages[activeImg]}
                  alt={title}
                  className="w-full h-full object-cover transition-all duration-500"
                />
                {/* Navigation arrows if multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((i) => (i - 1 + allImages.length) % allImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                 bg-black/50 backdrop-blur-sm text-white flex items-center
                                 justify-center hover:bg-black/70 transition-colors"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setActiveImg((i) => (i + 1) % allImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full
                                 bg-black/50 backdrop-blur-sm text-white flex items-center
                                 justify-center hover:bg-black/70 transition-colors"
                    >
                      ›
                    </button>
                  </>
                )}
                {/* Image count badge */}
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm
                                text-white text-xs px-2.5 py-1 rounded-lg">
                  {activeImg + 1} / {allImages.length}
                </div>
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2
                                  transition-all duration-200
                                  ${i === activeImg ? 'border-primary-500' : 'border-transparent opacity-60 hover:opacity-80'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="h-64 rounded-2xl bg-dark-800 flex items-center justify-center mb-3">
              <span className="text-6xl">{CATEGORY_ICONS[category] || '🏢'}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="container-main py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — Main info + tabs */}
          <div className="lg:col-span-2">
            {/* Title + badges */}
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-400 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{address}, {city}</span>
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-xl bg-primary-500/15
                               border border-primary-500/30 text-primary-400 font-medium capitalize">
                {CATEGORY_ICONS[category]} {category}
              </span>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              {[
                { label: 'Floors',       value: totalFloors   },
                { label: 'Units/Floor',  value: unitsPerFloor },
                { label: 'Total Units',  value: unitData.stats?.total || (totalFloors * unitsPerFloor) },
                { label: 'Available',    value: unitData.stats?.available ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center px-4 py-2.5
                                             bg-dark-800/60 border border-white/8 rounded-xl">
                  <span className="text-lg font-bold text-white">{value}</span>
                  <span className="text-gray-500 text-xs">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-6 bg-dark-800/50 p-1 rounded-xl">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === tab
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'Overview' && (
              <div className="animate-fadeIn">
                <h2 className="text-white font-semibold mb-3">About this Property</h2>
                <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {activeTab === 'Floor Plan' && (
              <div className="animate-fadeIn">
                <h2 className="text-white font-semibold mb-4">
                  Interactive Floor Plan
                  <span className="text-gray-500 font-normal text-sm ml-2">
                    — click an available unit to view details
                  </span>
                </h2>
                <UnitVisualizer
                  units={unitData.units}
                  grouped={unitData.grouped}
                  stats={unitData.stats}
                  property={property}
                  onUnitClick={setSelectedUnit}
                />
              </div>
            )}

            {activeTab === 'Location' && (
              <div className="animate-fadeIn">
                <h2 className="text-white font-semibold mb-4">Location</h2>
                {hasMap ? (
                  <div className="h-64 rounded-xl overflow-hidden border border-white/10">
                    <MapContainer
                      center={[location.lat, location.lng]}
                      zoom={15}
                      style={{ height: '100%', width: '100%' }}
                      scrollWheelZoom={false}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[location.lat, location.lng]} />
                    </MapContainer>
                  </div>
                ) : (
                  <div className="glass-card py-10 text-center">
                    <p className="text-gray-400 text-sm">
                      📍 {address}, {city}
                      <br />
                      <span className="text-gray-600">No map coordinates available for this property.</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right sidebar — Price + Company ──────────────────────────── */}
          <div className="space-y-4">
            {/* Price card */}
            <div className="glass-card p-5 sticky top-20">
              <p className="text-gray-400 text-xs mb-1">Booking Money</p>
              <p className="text-3xl font-black text-white mb-1">
                ৳{price?.toLocaleString()}
              </p>
              <p className="text-gray-500 text-xs mb-5">per unit</p>

              <button
                onClick={() => setActiveTab('Floor Plan')}
                className="btn-primary w-full mb-3"
              >
                🏗️ View Floor Plan
              </button>
              <p className="text-center text-gray-500 text-xs">
                Click a unit in the floor plan to book
              </p>
            </div>

            {/* Company card */}
            {companyId && (
              <div className="glass-card p-5">
                <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Listed by</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600/30
                                  to-primary-800/30 border border-primary-500/20 flex items-center
                                  justify-center flex-shrink-0 text-lg">
                    🏢
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{companyId.name}</p>
                    {companyId.email && (
                      <p className="text-gray-400 text-xs truncate">{companyId.email}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Unit Detail Modal (bottom sheet on mobile) ───────────────────── */}
      {selectedUnit && (
        <UnitDetailModal
          unit={selectedUnit}
          property={property}
          onClose={() => setSelectedUnit(null)}
        />
      )}
    </div>
  );
};

export default PropertyDetailPage;
