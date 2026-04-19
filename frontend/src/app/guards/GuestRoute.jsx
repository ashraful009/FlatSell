import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import LoadingScreen from '../../shared/components/LoadingScreen';

/**
 * getDashboardPath — returns the correct dashboard route for a user's role
 * Priority order: Super Admin > Company Admin > seller > customer/user
 */
const getDashboardPath = (roles = []) => {
  if (roles.includes('Super Admin'))    return '/super-admin';
  if (roles.includes('Company Admin'))  return '/company-admin';
  if (roles.includes('seller'))         return '/seller-dashboard';
  return '/customer-dashboard';
};

/**
 * GuestRoute — wraps Login / Register / Verify-OTP pages
 *
 * Behaviour:
 *  - loading  → show LoadingScreen (session check in progress)
 *  - isAuthenticated → redirect to correct dashboard (user never sees login again)
 *  - guest    → render the page normally
 */
const GuestRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user?.roles)} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
