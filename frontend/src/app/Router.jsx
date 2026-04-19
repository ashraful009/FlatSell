import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Layout & Guards (always loaded — tiny files)
import Layout         from './Layout';
import GuestRoute     from './guards/GuestRoute';
import ProtectedRoute from './guards/ProtectedRoute';
import LoadingScreen  from '../shared/components/LoadingScreen';

// Auth pages (small — eager loaded)
import LoginPage     from '../features/auth/LoginPage';
import RegisterPage  from '../features/auth/RegisterPage';
import VerifyOTPPage from '../features/auth/VerifyOTPPage';

// ── Lazy-loaded pages (code-split to reduce initial bundle) ──────────────────
// Each lazy import creates its own chunk — Leaflet only loads on pages that need it
const HomePage           = lazy(() => import('../pages/HomePage'));
const PropertiesPage     = lazy(() => import('../pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('../pages/PropertyDetailPage'));
const BecomeVendorPage   = lazy(() => import('../pages/BecomeVendorPage'));
const NotFoundPage       = lazy(() => import('../pages/NotFoundPage'));
const UnauthorizedPage   = lazy(() => import('../pages/UnauthorizedPage'));

// Dashboards (lazy — only loaded when user visits their dashboard)
const SuperAdminDashboard   = lazy(() => import('../pages/dashboards/SuperAdminDashboard'));
const CompanyAdminDashboard = lazy(() => import('../pages/dashboards/CompanyAdminDashboard'));
const SellerDashboard       = lazy(() => import('../pages/dashboards/SellerDashboard'));
const CustomerDashboard     = lazy(() => import('../pages/dashboards/CustomerDashboard'));

// ─────────────────────────────────────────────────────────────────────────────
const AppRouter = () => {
  return (
    <BrowserRouter>
      {/* Suspense wraps ALL lazy routes — shows LoadingScreen during chunk fetch */}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* ── All Routes are wrapped in Layout so Navbar is always visible ── */}
          <Route element={<Layout />}>
            
            {/* Public routes */}
            <Route index              element={<HomePage />} />
            <Route path="properties"  element={<PropertiesPage />} />
            <Route path="property/:id" element={<PropertyDetailPage />} />

            {/* Guest-only routes (redirect to dashboard if logged in) */}
            <Route element={<GuestRoute />}>
              <Route path="/login"      element={<LoginPage />} />
              <Route path="/register"   element={<RegisterPage />} />
              <Route path="/verify-otp" element={<VerifyOTPPage />} />
            </Route>

            {/* Become a Vendor (user/customer only) */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'customer']} />}>
              <Route path="/become-vendor" element={<BecomeVendorPage />} />
            </Route>

            {/* Dashboards */}
            <Route element={<ProtectedRoute allowedRoles={['Super Admin']} />}>
              <Route path="/super-admin/*" element={<SuperAdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['Company Admin']} />}>
              <Route path="/company-admin/*" element={<CompanyAdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['seller']} />}>
              <Route path="/seller-dashboard/*" element={<SellerDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['customer', 'user']} />}>
              <Route path="/customer-dashboard/*" element={<CustomerDashboard />} />
            </Route>

            {/* Utility pages */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route path="*"             element={<NotFoundPage />} />

          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRouter;
