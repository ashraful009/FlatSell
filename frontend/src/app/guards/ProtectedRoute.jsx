import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../../shared/hooks/useAuth';
import LoadingScreen from '../../shared/components/LoadingScreen';

/**
 * ProtectedRoute — wraps dashboard / private pages
 *
 * Props:
 *  - allowedRoles?: string[]  e.g. ['Super Admin'] or ['Company Admin', 'seller']
 *
 * Behaviour:
 *  - loading           → show LoadingScreen
 *  - !isAuthenticated  → redirect to /login
 *  - wrong role        → redirect to /unauthorized
 *  - all good          → render the page
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role-based access control
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRole = user?.roles?.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
