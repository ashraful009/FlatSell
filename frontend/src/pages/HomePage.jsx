import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../shared/lib/axiosInstance';
import PropertyCard from '../shared/components/PropertyCard';
import PropertyCardSkeleton from '../shared/components/PropertyCardSkeleton';

const CITIES = ['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal'];

const CATEGORIES = [
  { key: 'apartment',  icon: '🏢', label: 'Apartments', gradient: 'from-blue-600/25 to-blue-900/20',    border: 'hover:border-blue-500/40'   },
  { key: 'villa',      icon: '🏡', label: 'Villas',      gradient: 'from-pink-600/25 to-pink-900/20',    border: 'hover:border-pink-500/40'   },
  { key: 'commercial', icon: '🏬', label: 'Commercial',  gradient: 'from-purple-600/25 to-purple-900/20', border: 'hover:border-purple-500/40' },
  { key: 'land',       icon: '🌿', label: 'Land',        gradient: 'from-green-600/25 to-green-900/20',  border: 'hover:border-green-500/40'  },
  { key: 'office',     icon: '🏛️', label: 'Offices',     gradient: 'from-cyan-600/25 to-cyan-900/20',   border: 'hover:border-cyan-500/40'   },
];

// ── Counter animation hook ────────────────────────────────────────────────────
const useCounter = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setCount(Math.floor(current));
          if (current >= target) clearInterval(timer);
        }, 16);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
};

// ── Stat item ─────────────────────────────────────────────────────────────────
const StatItem = ({ target, suffix = '+', label }) => {
  const { count, ref } = useCounter(target);
  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl sm:text-4xl font-black text-white">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();

  const [searchCity,   setSearchCity]   = useState('');
  const [properties,   setProperties]   = useState([]);
  const [propLoading,  setPropLoading]  = useState(true);

  // Fetch featured properties
  useEffect(() => {
    axiosInstance.get('/properties/approved?limit=6')
      .then((r) => setProperties(r.data.data.properties))
      .catch(() => setProperties([]))
      .finally(() => setPropLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/properties${searchCity ? `?city=${encodeURIComponent(searchCity)}` : ''}`);
  };

  const handleCityClick = (city) => {
    navigate(`/properties?city=${encodeURIComponent(city)}`);
  };

  const handleCategory = (cat) => {
    navigate(`/properties?category=${cat}`);
  };

  return (
    <div className="min-h-screen bg-dark-900">

      {/* ══════════════════════════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[88vh] flex items-center">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-900" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl
                        animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-10 right-10 w-96 h-64 bg-accent-500/10 rounded-full blur-3xl
                        animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[600px] h-[400px] bg-primary-800/10 rounded-full blur-3xl" />

        <div className="container-main relative z-10 py-24">
          <div className="max-w-3xl animate-slideUp">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8
                            bg-primary-500/10 border border-primary-500/20">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span className="text-primary-400 text-sm font-medium">
                Bangladesh&apos;s #1 Real Estate Marketplace
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-none tracking-tight">
              Find Your<br />
              <span className="text-gradient">Perfect Home</span><br />
              in Bangladesh
            </h1>

            <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-xl leading-relaxed">
              Browse thousands of verified properties from trusted companies.
              Apartments, villas, commercial spaces — all in one place.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch}
                  className="flex flex-col sm:flex-row gap-3 max-w-xl mb-6">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="form-input pl-10"
                  placeholder="Search by city (e.g. Dhaka)"
                />
              </div>
              <button type="submit" className="btn-primary px-8 whitespace-nowrap">
                Search Properties
              </button>
            </form>

            {/* Quick city chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-gray-500 text-sm self-center">Popular:</span>
              {CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => handleCityClick(city)}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10
                             text-gray-300 text-sm hover:text-white hover:bg-white/10
                             hover:border-white/20 transition-all duration-200"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="border-y border-white/5 bg-dark-950/50">
        <div className="container-main py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            <StatItem target={500}  suffix="+"  label="Properties Listed"  />
            <StatItem target={120}  suffix="+"  label="Verified Companies"  />
            <StatItem target={5000} suffix="+"  label="Happy Customers"     />
            <StatItem target={25}   suffix="+"  label="Cities Covered"      />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="container-main">
          <div className="text-center mb-10">
            <h2 className="section-title mb-2">Browse by Category</h2>
            <p className="text-gray-400">Find exactly what you&apos;re looking for</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {CATEGORIES.map(({ key, icon, label, gradient, border }) => (
              <button
                key={key}
                onClick={() => handleCategory(key)}
                className={`group flex flex-col items-center gap-3 p-5 sm:p-6 rounded-2xl
                  border border-white/8 bg-gradient-to-br ${gradient}
                  ${border} hover:scale-105 transition-all duration-300 cursor-pointer`}
              >
                <span className="text-3xl sm:text-4xl group-hover:scale-110
                                 transition-transform duration-300">
                  {icon}
                </span>
                <span className="text-white font-semibold text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURED PROPERTIES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-dark-950/30">
        <div className="container-main">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-title mb-2">Featured Properties</h2>
              <p className="text-gray-400">Handpicked listings from verified companies</p>
            </div>
            <Link to="/properties"
              className="text-primary-400 hover:text-primary-300 text-sm font-medium
                         flex items-center gap-1 transition-colors flex-shrink-0">
              View all →
            </Link>
          </div>

          {propLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {properties.map((p) => <PropertyCard key={p._id} property={p} />)}
            </div>
          ) : (
            <div className="glass-card py-16 text-center">
              <p className="text-4xl mb-3">🏗️</p>
              <p className="text-white font-semibold">No properties yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Check back soon — companies are listing properties daily.
              </p>
            </div>
          )}

          {!propLoading && properties.length > 0 && (
            <div className="text-center mt-10">
              <Link to="/properties" className="btn-secondary inline-flex">
                Browse All Properties →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          VENDOR CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="container-main">
          <div className="relative overflow-hidden rounded-3xl
                          bg-gradient-to-br from-primary-900/80 via-primary-800/60 to-dark-800
                          border border-primary-500/20 p-8 sm:p-12 text-center">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10
                            rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/10
                            rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

            <div className="relative">
              <span className="text-5xl mb-5 block">🏢</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Are you a Real Estate Company?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
                Join 120+ verified companies already selling on FlatSell.
                List your properties and reach thousands of verified buyers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/register" className="btn-primary px-8 py-3">
                  Get Started — It&apos;s Free
                </Link>
                <Link to="/become-vendor" className="btn-secondary px-8 py-3">
                  Already have an account?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
