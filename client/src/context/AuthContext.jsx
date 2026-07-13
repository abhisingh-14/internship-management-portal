// client/src/context/AuthContext.jsx

import { createContext, useEffect, useReducer, useCallback } from 'react';
import PropTypes from 'prop-types';
import * as authService from '../services/authService';

// AuthContext is intentionally exported alongside AuthProvider from this
// single file, per the file layout established in
// docs/Components/05_Authentication.md; only Fast Refresh's dev-time
// hot-reload granularity is affected, not runtime behavior.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_REFRESH_TOKEN_KEY = 'authRefreshToken';
const AUTH_USER_KEY = 'authUser';

const ACTIONS = {
  AUTH_START: 'AUTH_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_FAIL: 'AUTH_FAIL',
  LOGOUT: 'LOGOUT',
  FINISH_BOOTSTRAP: 'FINISH_BOOTSTRAP',
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // true only during initial session restore
  isSubmitting: false, // true during login/register requests
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case ACTIONS.AUTH_START:
      return { ...state, isSubmitting: true, error: null };
    case ACTIONS.AUTH_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isSubmitting: false,
        isLoading: false,
        error: null,
      };
    case ACTIONS.AUTH_FAIL:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isSubmitting: false,
        isLoading: false,
        error: action.payload,
      };
    case ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isSubmitting: false,
        error: null,
      };
    case ACTIONS.FINISH_BOOTSTRAP:
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

function persistSession({ token, refreshToken, user }) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  if (refreshToken) {
    localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
  }
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session on first load: if a token exists, trust it optimistically
  // from localStorage, then confirm it's still valid via GET /auth/me.
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = localStorage.getItem(AUTH_USER_KEY);

      if (!token || !storedUser) {
        dispatch({ type: ACTIONS.FINISH_BOOTSTRAP });
        return;
      }

      try {
        const user = await authService.getMe();
        dispatch({ type: ACTIONS.AUTH_SUCCESS, payload: { token, user } });
      } catch (error) {
        clearSession();
        dispatch({ type: ACTIONS.AUTH_FAIL, payload: null });
      }
    };

    restoreSession();
  }, []);

  // Listen for the global 401 signal dispatched by the Axios response
  // interceptor in services/api.js, so an expired/invalid token clears
  // AuthContext even when triggered by a request outside a form submit.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearSession();
      dispatch({ type: ACTIONS.LOGOUT });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const register = useCallback(async (formData) => {
    dispatch({ type: ACTIONS.AUTH_START });
    try {
      const { user, token, refreshToken } = await authService.register(formData);
      persistSession({ token, refreshToken, user });
      dispatch({ type: ACTIONS.AUTH_SUCCESS, payload: { token, user } });
      return user;
    } catch (error) {
      dispatch({ type: ACTIONS.AUTH_FAIL, payload: error.message });
      throw error;
    }
  }, []);

  const login = useCallback(async (credentials) => {
    dispatch({ type: ACTIONS.AUTH_START });
    try {
      const { user, token, refreshToken } = await authService.login(credentials);
      persistSession({ token, refreshToken, user });
      dispatch({ type: ACTIONS.AUTH_SUCCESS, payload: { token, user } });
      return user;
    } catch (error) {
      dispatch({ type: ACTIONS.AUTH_FAIL, payload: error.message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Logout is client-side by design (stateless JWT); ignore network
      // errors here rather than blocking the local session from clearing.
    } finally {
      clearSession();
      dispatch({ type: ACTIONS.LOGOUT });
    }
  }, []);

  const value = {
    user: state.user,
    token: state.token,
    role: state.user?.role ?? null,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isSubmitting: state.isSubmitting,
    error: state.error,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export { AUTH_TOKEN_KEY };