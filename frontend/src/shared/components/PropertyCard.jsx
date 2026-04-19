import { Link } from 'react-router-dom';

/**
 * PropertyCard — Reusable card for property listings
 *
 * Props:
 *  - property: { _id, title, price, city, category, images[], status, companyId, totalFloors, unitsPerFloor }
 */
const PropertyCard = ({ property }) => {
  const {
    _id, title, price, city, category,
    mainImage, galleryImages, images, companyId, totalFloors, unitsPerFloor,
  } = property;

  const coverImage = mainImage || galleryImages?.[0] || images?.[0] || null;
  const totalImgs = (mainImage ? 1 : 0) + (galleryImages?.length || 0) || images?.length || 0;
  const totalUnits = totalFloors * unitsPerFloor;

  const categoryColors = {
    apartment:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    commercial: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    land:       'bg-amber-500/20 text-amber-400 border-amber-500/30',
    villa:      'bg-pink-500/20 text-pink-400 border-pink-500/30',
    office:     'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <Link
      to={`/property/${_id}`}
      className="group block glass-card overflow-hidden hover:border-primary-500/40
                 hover:shadow-glow transition-all duration-300"
    >
      {/* Image */}
      <div className="relative h-48 sm:h-52 bg-dark-800 overflow-hidden flex-shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105
                       transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center
                          bg-gradient-to-br from-primary-950/50 to-dark-800">
            <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9
                   0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1
                   1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium border
                           backdrop-blur-sm ${categoryColors[category] || categoryColors.apartment}`}>
            {category?.charAt(0).toUpperCase() + category?.slice(1)}
          </span>
        </div>

        {/* Image count */}
        {totalImgs > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm
                          text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2
                       2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0
                       00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {totalImgs}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-1
                       group-hover:text-primary-300 transition-colors mb-1">
          {title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
               stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827
                 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span className="truncate">{city}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" />
            </svg>
            {totalFloors} Floor{totalFloors > 1 ? 's' : ''}
          </span>
          <span className="text-white/20">·</span>
          <span>{totalUnits} Unit{totalUnits > 1 ? 's' : ''}</span>
          {companyId?.name && (
            <>
              <span className="text-white/20">·</span>
              <span className="truncate text-primary-500">{companyId.name}</span>
            </>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Booking Money</p>
            <p className="text-lg font-bold text-white">
              ৳{price?.toLocaleString()}
            </p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary-500/15 border border-primary-500/30
                          flex items-center justify-center group-hover:bg-primary-500/25
                          transition-colors">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
