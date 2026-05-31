import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

// ── Helpers ────────────────────────────────────────────────────────────────
const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

/** Returns ALL dashboard links for every role the user holds */
const getDashboardLinks = (roles = []) => {
  const links = [];
  if (roles.includes('Super Admin'))
    links.push({ label: 'Admin Dashboard',   path: '/super-admin',        icon: '⚡' });
  if (roles.includes('Company Admin'))
    links.push({ label: 'Company Dashboard', path: '/company-admin',      icon: '🏢' });
  if (roles.includes('seller'))
    links.push({ label: 'Seller Dashboard',  path: '/seller-dashboard',   icon: '🏠' });
  if (roles.includes('customer') || roles.includes('user'))
    links.push({ label: 'My Profile',        path: '/customer-dashboard', icon: '👤' });
  return links;
};

/** "Become a Vendor" shows ONLY for pure user/customer — never for vendors/admins */
const shouldShowVendorBtn = (isAuthenticated, roles = []) => {
  if (!isAuthenticated) return false;
  const vendorRoles = ['Super Admin', 'Company Admin', 'seller'];
  return !roles.some((r) => vendorRoles.includes(r));
};

// ── Nav links (public) ─────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home',       path: '/' },
  { label: 'Properties', path: '/properties' },
  
];

// ─────────────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [scrolled,     setScrolled]     = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Add shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  const handleNavClick = () => setMobileOpen(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  };

  const dashboardLinks   = getDashboardLinks(user?.roles);
  const showVendorBtn    = shouldShowVendorBtn(isAuthenticated, user?.roles);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300
        bg-white/90 backdrop-blur-xl border-b border-slate-100
        ${scrolled ? 'shadow-glass' : ''}`}
    >
      <div className="container-main">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ──────────────────────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0"
                onClick={handleNavClick}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700
                            flex items-center justify-center shadow-glow flex-shrink-0">
              <span className="text-white font-black text-base">F</span>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              Flat<span className="text-gradient">Sell</span>
            </span>
          </Link>

          {/* ── Desktop Nav Links ──────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, path }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                   ${isActive
                     ? 'text-gray-900 bg-blue-50'
                     : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
                   }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop Auth Section ───────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Skeleton while checking session */}
            {loading ? (
              <>
                <div className="skeleton w-28 h-9 rounded-xl" />
                <div className="skeleton-avatar w-9 h-9" />
              </>
            ) : isAuthenticated ? (
              <>
                {/* Become a Vendor CTA */}
                {showVendorBtn && (
                  <Link
                    to="/become-vendor"
                    className="text-sm font-semibold px-4 py-2 rounded-xl
                               bg-accent-500/15 text-accent-400 border border-accent-500/30
                               hover:bg-accent-500/25 transition-all duration-200"
                  >
                    🏷️ Become a Vendor
                  </Link>
                )}

                {/* Profile Avatar + Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="profile-avatar-btn"
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                               flex items-center justify-center text-white font-bold text-sm
                               ring-2 ring-transparent hover:ring-primary-500/60
                               transition-all duration-200 shadow-glow focus:outline-none
                               focus:ring-primary-500/80"
                    aria-label="Profile menu"
                    aria-expanded={dropdownOpen}
                  >
                    {user?.avatar
                      ? <img src={user.avatar} alt={user.name}
                             className="w-full h-full rounded-full object-cover" />
                      : getInitials(user?.name)
                    }
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-56 glass-card py-2
                                    shadow-glass animate-fadeIn origin-top-right">

                      {/* User info */}
                      <div className="px-4 py-2 border-b border-blue-100 mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {user?.roles?.map((role) => (
                            <span key={role}
                              className="text-xs px-1.5 py-0.5 bg-primary-500/20
                                         text-primary-600 rounded-md font-medium">
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Dashboard links by role */}
                      {dashboardLinks.map(({ label, path, icon }) => (
                        <Link
                          key={path}
                          to={path}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600
                                     hover:text-gray-900 hover:bg-blue-50 transition-colors"
                        >
                          <span>{icon}</span> {label}
                        </Link>
                      ))}

                      <div className="border-t border-blue-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm
                                     text-red-600 hover:text-red-300 hover:bg-red-500/10
                                     transition-colors text-left"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0
                                 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest — show Login & Register */
              <>
                <Link to="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900
                             px-4 py-2 rounded-lg hover:bg-slate-50 transition-all">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile: Hamburger ─────────────────────────────────────── */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Avatar visible on mobile too when logged in */}
            {!loading && isAuthenticated && (
              <button
                onClick={() => { setDropdownOpen(false); setMobileOpen((o) => !o); }}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700
                           flex items-center justify-center text-white font-bold text-xs"
              >
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                  : getInitials(user?.name)
                }
              </button>
            )}
            <button
              id="mobile-menu-btn"
              onClick={() => setMobileOpen((o) => !o)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-slate-50
                         transition-all focus:outline-none"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ─────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/90 backdrop-blur-xl animate-fadeIn">
          <div className="container-main py-4 space-y-1">

            {/* Nav links */}
            {NAV_LINKS.map(({ label, path }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors
                   ${isActive ? 'bg-blue-50 text-gray-900' : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'}`
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="border-t border-blue-100 pt-3 mt-3 space-y-1">
              {loading ? (
                <div className="skeleton h-10 rounded-xl" />
              ) : isAuthenticated ? (
                <>
                  {/* User info */}
                  <div className="px-4 py-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>

                  {/* Dashboard links */}
                  {dashboardLinks.map(({ label, path, icon }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={handleNavClick}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600
                                 hover:text-gray-900 hover:bg-slate-50 rounded-xl transition-colors"
                    >
                      <span>{icon}</span> {label}
                    </Link>
                  ))}

                  {/* Become a Vendor (mobile) */}
                  {showVendorBtn && (
                    <Link
                      to="/become-vendor"
                      onClick={handleNavClick}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-accent-400
                                 hover:bg-accent-500/10 rounded-xl transition-colors"
                    >
                      🏷️ Become a Vendor
                    </Link>
                  )}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600
                               hover:bg-red-500/10 rounded-xl transition-colors mt-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3
                           3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={handleNavClick}
                    className="block px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900
                               hover:bg-slate-50 rounded-xl transition-colors">
                    Login
                  </Link>
                  <Link to="/register" onClick={handleNavClick}
                    className="block px-4 py-2.5 text-sm text-white font-semibold
                               bg-gradient-to-r from-primary-600 to-primary-500
                               rounded-xl text-center">
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
