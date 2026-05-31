import React from 'react';
import { Link } from 'react-router-dom';

const PropertyHeroGallery = ({
  title,
  category,
  allImages,
  activeImg,
  setActiveImg,
  categoryIcons,
}) => {
  return (
    <div className="bg-gray-100">
      <div className="container-main pt-6 pb-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-gray-900 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/properties" className="hover:text-gray-900 transition-colors">Properties</Link>
          <span>/</span>
          <span className="text-gray-600 truncate max-w-xs">{title}</span>
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
          <div className="h-64 rounded-2xl bg-white flex items-center justify-center mb-3">
            <span className="text-6xl">{categoryIcons[category] || '🏢'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyHeroGallery;
