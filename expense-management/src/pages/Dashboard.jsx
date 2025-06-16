import React, { useEffect, useState } from 'react';
import api from '../utils/axios';
import {
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Modal,
  Box,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PieChartIcon from '@mui/icons-material/PieChart';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import UpdateIcon from '@mui/icons-material/Update';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddExpenseForm from './AddExpenseForm';
import ExpenseSummaryModal from './ExpenseSummaryModal';
import ApprovedExpensesModal from './ApprovedExpensesModal';
import AuditLogsModal from './AuditLogsModal';
import NotificationCenter from './NotificationCenter';
import { useNavigate } from 'react-router-dom';
import MonthlyBudgetSettings from './MonthlyBudgetSettings';
import ExpenseGraph from './ExpenseGraph';
import { useAuth } from '../context/AuthContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenseData, setExpenseData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [approvedModalOpen, setApprovedModalOpen] = useState(false);
  const [auditLogsModalOpen, setAuditLogsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    pendingApprovals: 0,
    approvedExpenses: 0,
    monthlyBudget: 0
  });
  const [budgetSettingsOpen, setBudgetSettingsOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const { user, logout, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Dashboard mounted or user/navigate changed. User:', user, 'Auth Loading:', authLoading);
    if (authLoading) {
      console.log('AuthContext is still loading, waiting...');
      return;
    }
    if (!user) {
      console.log('User is null, navigating to login.');
      navigate('/login');
      return;
    }
    console.log('User is present. Fetching dashboard data...');
    fetchExpenses();
    fetchMonthlyBudget();
    fetchProfileImage();
    fetchDashboardData();
  }, [user, navigate, authLoading]);

  useEffect(() => {
    calculateStats();
  }, [expenseData]);

  const fetchMonthlyBudget = async () => {
    try {
      const response = await api.get('/settings/monthly-budget');
      setStats(prev => ({
        ...prev,
        monthlyBudget: response.data.budget || 50000 // Fallback to 50000 if not set
      }));
    } catch (error) {
      console.error('Error fetching monthly budget:', error);
      // Keep default budget if fetch fails
      setStats(prev => ({
        ...prev,
        monthlyBudget: 50000
      }));
    }
  };

  const calculateStats = () => {
    console.log('Calculating stats for expenses:', expenseData); // Debug log
    const total = expenseData.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    
    // Count expenses by status
    const statusCounts = expenseData.reduce((acc, exp) => {
      const status = (exp.approval_status || '').toUpperCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Status counts:', statusCounts); // Debug log

    setStats(prev => ({
      ...prev,
      totalExpenses: total,
      pendingApprovals: statusCounts['PENDING'] || 0,
      approvedExpenses: statusCounts['APPROVED'] || 0
    }));
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      console.log('Raw expense data from API:', response.data); // Debug log
      const normalizedExpenses = response.data.map((expense) => ({
        ...expense,
        date: expense.date
          ? new Date(expense.date).toISOString().split('T')[0]
          : null,
        amount: parseFloat(expense.amount) || 0,
        category: expense.category || 'Unknown',
        description: expense.description || '',
        approval_status: expense.approvalStatus || 'PENDING', // Use approvalStatus from backend
      }));
      console.log('Normalized expenses:', normalizedExpenses); // Debug log
      setExpenseData(normalizedExpenses);
      setError('');
    } catch (error) {
      const errorMessage = error.response
        ? `API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`
        : `Network Error: ${error.message}`;
      setError(errorMessage);
      console.error('Error fetching expenses:', error);
    }
  };

  const handleAddExpense = (newExpense) => {
    setExpenseData((prev) => [...prev, newExpense]);
    fetchExpenses(); // Re-fetch to sync with database
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get('/audit/logs');
      console.log('Fetched audit logs:', response.data);
    } catch (err) {
      setError('Failed to fetch audit logs: ' + (err.response ? err.response.data : err.message));
    }
  };

  const handleCardClick = (title) => {
    if (title === 'Create Expense') {
      setModalOpen(true);
    } else if (title === 'Expense Summary') {
      setSummaryModalOpen(true);
    } else if (title === 'Approve Expenses') {
      setApprovedModalOpen(true);
    } else if (title === 'Export Report') {
      // Export report logic
      api({
        url: '/expenses/export',
        method: 'GET',
        responseType: 'blob', // important
      })
        .then((response) => {
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'expenses_report.csv');
          document.body.appendChild(link);
          link.click();
          link.remove();
        })
        .catch((err) => {
          setError('Failed to export report: ' + (err.response ? err.response.data : err.message));
        });
    } else if (title === 'Audit Logs') {
      fetchAuditLogs();
      setAuditLogsModalOpen(true);
    }
  };

  const handleBudgetUpdate = (newBudget) => {
    setStats(prev => ({
      ...prev,
      monthlyBudget: newBudget
    }));
  };

  const fetchProfileImage = async () => {
    try {
      const response = await api.get('/auth/profile/image', {
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(response.data);
      setProfileImage(imageUrl);
    } catch (error) {
      console.error('Error fetching profile image:', error);
      // Don't set error state here as it's not critical
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setUploadError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('File size should be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setUploadError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await api.post('/auth/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Refresh the profile image
      await fetchProfileImage();
      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/dashboard');
      setDashboardData(response.data);
      setError('');
    } catch (error) {
      const errorMessage = error.response
        ? `API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`
        : `Network Error: ${error.message}`;
      setError(errorMessage);
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    console.log('Dashboard or Auth is loading. Displaying loading spinner.');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    console.log('Dashboard error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  const categoryData = dashboardData?.expensesByCategory
    ? Object.entries(dashboardData.expensesByCategory).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  const monthlyData = dashboardData?.monthlyExpenses
    ? Object.entries(dashboardData.monthlyExpenses).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Expense Management</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4">Welcome, {user?.fullName}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg leading-6 font-medium text-gray-900">Expenses</h2>
            </div>
            <div className="border-t border-gray-200">
              {expenseData.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No expenses found</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenseData.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ${expense.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            expense.approval_status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : expense.approval_status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {expense.approval_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                ${dashboardData?.totalExpenses.toFixed(2)}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Pending Expenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                ${dashboardData?.pendingExpenses.toFixed(2)}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Approved Expenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-green-600">
                ${dashboardData?.approvedExpenses.toFixed(2)}
              </dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Rejected Expenses</dt>
              <dd className="mt-1 text-3xl font-semibold text-red-600">
                ${dashboardData?.rejectedExpenses.toFixed(2)}
              </dd>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Expenses</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8884d8" name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expenses by Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Expenses</h3>
          </div>
          <div className="border-t border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.recentExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        expense.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : expense.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {expense.priority}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;