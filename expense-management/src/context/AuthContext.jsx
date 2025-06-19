import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const AuthContext = createContext(null);

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation(); // Get location object here

  useEffect(() => {
    console.log('AuthContext useEffect: BEGIN');
    console.log('AuthContext useEffect: Current URL:', window.location.href);
    console.log('AuthContext useEffect: Location search string:', location.search);

    const initializeAuth = async () => {
      let token = localStorage.getItem('token');
      let storedUser = localStorage.getItem('user');

      // Check for OAuth2 parameters in URL first
      const queryParams = new URLSearchParams(location.search);
      const tokenParam = queryParams.get('token');
      const userParam = queryParams.get('user');

      if (tokenParam && userParam) {
        console.log('AuthContext useEffect: Found OAuth2 params in URL.');
        try {
          // Try to parse user as JSON (expected: URL-encoded JSON string)
          let userData;
          try {
            userData = JSON.parse(decodeURIComponent(userParam));
          } catch (parseErr) {
            console.warn('AuthContext: Failed to parse userParam as JSON. Using raw string.', userParam);
            userData = userParam; // fallback: store as string
          }
          localStorage.setItem('token', tokenParam);
          localStorage.setItem('user', typeof userData === 'string' ? userData : JSON.stringify(userData));
          token = tokenParam; // Update local variables
          storedUser = typeof userData === 'string' ? userData : JSON.stringify(userData); // Update local variables
          console.log('AuthContext useEffect: Processed OAuth2 URL params and saved to localStorage.');
          
          // Remove params from URL history to keep it clean
          window.history.replaceState({}, document.title, location.pathname);

        } catch (oauthError) {
          console.error('AuthContext useEffect: Error processing OAuth2 URL parameters:', oauthError, userParam);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          token = null;
          storedUser = null;
        }
      }

      // Now check localStorage (will include newly set OAuth2 data if present)
      if (token && storedUser) {
        try {
          // Try to parse user if it's a JSON string, else use as is
          let userData;
          try {
            userData = JSON.parse(storedUser);
          } catch (e) {
            userData = storedUser;
          }
          setUser(userData);
          setIsAuthenticated(true);
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('AuthContext useEffect: Authenticated from localStorage or URL params.');
        } catch (error) {
          console.error('AuthContext useEffect: Error parsing stored user/token:', error, storedUser);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
        console.log('AuthContext useEffect: No valid token/user found. Not authenticated.');
      }
      setLoading(false);
      console.log('AuthContext useEffect: END');
    };

    initializeAuth();
  }, [location.search]); // Depend on location.search to re-run when URL changes

  // Add response interceptor to handle token expiration
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext.login: Attempting login for', email);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      console.log('AuthContext.login: API response received.', response.data);
      
      // Destructure token and user from response.data (backend now sends them directly)
      const { token, user: userData } = response.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('AuthContext.login: User and authentication state updated.');
      return response.data;
    } catch (error) {
      console.error('AuthContext.login: Login error:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const signup = async (userData) => {
    try {
      const response = await api.post('/api/auth/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isAuthenticated,
      setUser,
      setIsAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 