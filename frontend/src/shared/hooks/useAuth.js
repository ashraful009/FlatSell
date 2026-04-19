import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth — Access global auth state from any component
 *
 * Returns: { user, isAuthenticated, loading, login, logout, updateUser }
 *
 * Usage:
 *   const { user, isAuthenticated, logout } = useAuth();
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
};

export default useAuth;
