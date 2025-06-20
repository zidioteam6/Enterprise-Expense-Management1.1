import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, EyeOff, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, setUser, setIsAuthenticated, user } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('LoginPage useEffect: BEGIN');
    console.log('Current URL:', window.location.href);
    console.log('Location search string:', location.search);

    // If user is already authenticated, redirect based on role
    if (isAuthenticated && user) {
      if (
        user.role === 'ROLE_ADMIN' ||
        user.roles === 'ROLE_ADMIN' ||
        (Array.isArray(user.roles) && user.roles.includes('ROLE_ADMIN'))
      ) {
        navigate('/admin-dashboard');
      } else if (
        user.role === 'ROLE_MANAGER' ||
        user.roles === 'ROLE_MANAGER' ||
        (Array.isArray(user.roles) && user.roles.includes('ROLE_MANAGER'))
      ) {
        navigate('/manager-dashboard');
      } else if (
        user.role === 'ROLE_FINANCE' ||
        user.roles === 'ROLE_FINANCE' ||
        (Array.isArray(user.roles) && user.roles.includes('ROLE_FINANCE'))
      ) {
        navigate('/finance-dashboard');
      } else {
        navigate('/dashboard');
      }
      return;
    }

    // The OAuth2 URL parameter handling has been moved to AuthContext.jsx
    // This useEffect will now only handle direct login and existing localStorage tokens.

    // Fallback: Check if we're coming from OAuth2 login with data already in localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    console.log('LoginPage useEffect: LocalStorage token:', token ? 'present' : 'not present');
    console.log('LoginPage useEffect: LocalStorage user:', userStr ? 'present' : 'not present');

    if (token && userStr) {
      try {
        const userData = JSON.parse(userStr);
        console.log('LoginPage useEffect: Successfully parsed user data from localStorage:', userData);
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        setIsAuthenticated(true);
        // Redirect based on role
        if (
          userData.role === 'ROLE_ADMIN' ||
          userData.roles === 'ROLE_ADMIN' ||
          (Array.isArray(userData.roles) && userData.roles.includes('ROLE_ADMIN'))
        ) {
          navigate('/admin-dashboard');
        } else if (
          userData.role === 'ROLE_MANAGER' ||
          userData.roles === 'ROLE_MANAGER' ||
          (Array.isArray(userData.roles) && userData.roles.includes('ROLE_MANAGER'))
        ) {
          navigate('/manager-dashboard');
        } else if (
          userData.role === 'ROLE_FINANCE' ||
          userData.roles === 'ROLE_FINANCE' ||
          (Array.isArray(userData.roles) && userData.roles.includes('ROLE_FINANCE'))
        ) {
          navigate('/finance-dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch (storageError) {
        console.error('LoginPage useEffect: Error processing OAuth2 login from storage:', storageError);
        setError('Error processing OAuth2 login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    console.log('LoginPage useEffect: END');
  }, [navigate, isAuthenticated, setUser, setIsAuthenticated, location.search, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    console.log('LoginPage handleSubmit: Attempting traditional login.', formData.email);

    try {
      await login(formData.email, formData.password);
      // navigate('/dashboard'); // Let the useEffect based on isAuthenticated handle navigation
    } catch (error) {
      setError(error.message || 'Failed to login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOAuthLogin = (provider) => {
    // Clear any existing auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to OAuth provider
    window.location.href = `http://localhost:8080/oauth2/authorization/${provider}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        {/* Sign up link */}
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 hover:underline">Sign up</Link>
          </p>
        </div>

        {/* Social Login Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow h-px bg-gray-300"></div>
          <span className="mx-4 text-sm text-gray-500">Or login with</span>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>

        {/* Social Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <img
              className="h-5 w-5 mr-2"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
            />
            Continue with Google
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <img
              className="h-5 w-5 mr-2"
              src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
              alt="GitHub logo"
            />
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
