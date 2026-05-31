import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import axiosInstance from '../shared/lib/axiosInstance';
import UnitVisualizer from '../features/units/UnitVisualizer';
import UnitDetailModal from '../features/units/UnitDetailModal';

// Modular components
import PropertyDetailSkeleton from './property-detail/components/PropertyDetailSkeleton';
import PropertyHeroGallery from './property-detail/components/PropertyHeroGallery';
import PropertyQuickStats from './property-detail/components/PropertyQuickStats';
import PropertyAboutTab from './property-detail/components/PropertyAboutTab';
import PropertySidebar from './property-detail/components/PropertySidebar';

const TABS = ['Overview', 'Floor Plan', 'Location'];

const CATEGORY_ICONS = {
  apartment: '🏢', villa: '🏡', land: '🌿',
};

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
        <p className="text-gray-900 font-semibold mb-2">{error}</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">← Back to Home</Link>
      </div>
    );
  }

  const {
    title, description, price, city, address, category,
    mainImage, galleryImages, images, totalFloors, unitsPerFloor,
    companyId, location, villaDetails, landDetails,
  } = property;

  const cat = category?.toLowerCase();

  const allImages = [];
  if (mainImage) allImages.push(mainImage);
  if (galleryImages?.length) allImages.push(...galleryImages);
  if (!allImages.length && images?.length) allImages.push(...images);

  const hasMap = location?.lat && location?.lng;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ── Hero Image Gallery ──────────────────────────────────────────── */}
      <PropertyHeroGallery
        title={title}
        category={category}
        allImages={allImages}
        activeImg={activeImg}
        setActiveImg={setActiveImg}
        categoryIcons={CATEGORY_ICONS}
      />

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="container-main py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left — Main info + tabs */}
          <div className="lg:col-span-2">
            {/* Title + badges */}
            <div className="flex flex-wrap items-start gap-3 mb-3">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
                <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{address}, {city}</span>
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-xl bg-primary-500/15
                               border border-primary-500/30 text-primary-600 font-medium capitalize">
                {CATEGORY_ICONS[category]} {category}
              </span>
            </div>

            {/* Quick stats — category-aware */}
            <PropertyQuickStats
              cat={cat}
              villaDetails={villaDetails}
              landDetails={landDetails}
              totalFloors={totalFloors}
              unitsPerFloor={unitsPerFloor}
              unitData={unitData}
            />

            {/* ── Tabs ─────────────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-6 bg-slate-50 p-1 rounded-xl">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200
                    ${activeTab === tab
                      ? 'bg-blue-50 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'Overview' && (
              <PropertyAboutTab
                cat={cat}
                description={description}
                villaDetails={villaDetails}
                landDetails={landDetails}
              />
            )}

            {activeTab === 'Floor Plan' && (
              <div className="animate-fadeIn">
                <h2 className="text-gray-900 font-semibold mb-4">
                  {cat === 'villa' ? 'Villa Visualizer' : cat === 'land' ? 'Plot Visualizer' : 'Interactive Floor Plan'}
                  {cat === 'apartment' && (
                    <span className="text-gray-500 font-normal text-sm ml-2">
                      — click an available unit to view details
                    </span>
                  )}
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
                <h2 className="text-gray-900 font-semibold mb-4">Location</h2>
                {hasMap ? (
                  <div className="h-64 rounded-xl overflow-hidden border border-blue-100">
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
                    <p className="text-gray-500 text-sm">
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
          <PropertySidebar
            cat={cat}
            price={price}
            villaDetails={villaDetails}
            landDetails={landDetails}
            unitData={unitData}
            companyId={companyId}
            setActiveTab={setActiveTab}
            setSelectedUnit={setSelectedUnit}
          />
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
