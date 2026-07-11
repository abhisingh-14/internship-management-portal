// client/src/hooks/useAuth.js

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Convenience hook for accessing AuthContext. Throws early if used outside
 * an AuthProvider, catching integration mistakes at development time.
 * @returns {{
 *   user: object|null,
 *   token: string|null,
 *   role: string|null,
 *   isAuthenticated: boolean,
 *   isLoading: boolean,
 *   isSubmitting: boolean,
 *   error: string|null,
 *   register: (formData: object) => Promise<object>,
 *   login: (credentials: object) => Promise<object>,
 *   logout: () => Promise<void>,
 * }}
 */
function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default useAuth;