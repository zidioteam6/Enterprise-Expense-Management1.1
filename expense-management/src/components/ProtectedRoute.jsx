import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ProtectedRoute = ({ children, adminOnly = false, managerOnly = false }) => {
  const { isAuthenticated, user, setUser, setIsAuthenticated, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // If we have a token and stored user, but not authenticated, try to authenticate
    if (token && storedUser && !isAuthenticated) {
      try {
        const userData = JSON.parse(storedUser);
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error processing stored auth:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [isAuthenticated, setUser, setIsAuthenticated]);

  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner/loading component
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin role (handle all possible formats)
  const isAdmin =
    user?.role === 'ROLE_ADMIN' ||
    user?.roles === 'ROLE_ADMIN' ||
    (Array.isArray(user?.roles) && user.roles.includes('ROLE_ADMIN'));

  // Check for manager role (handle all possible formats)
  const isManager =
    user?.role === 'ROLE_MANAGER' ||
    user?.roles === 'ROLE_MANAGER' ||
    (Array.isArray(user?.roles) && user.roles.includes('ROLE_MANAGER'));

  // If adminOnly is true, check for admin role
  if (adminOnly && !isAdmin) {
    // Redirect non-admins to the normal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // If managerOnly is true, check for manager role
  if (managerOnly && !isManager) {
    // Redirect non-managers to the normal dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute; 