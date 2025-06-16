import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  TrendingUp, 
  Bell, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Upload,
  User,
  Building,
  CreditCard,
  Camera,
  Paperclip
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';

const API_BASE = 'http://localhost:8080';

const EmployeeDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Backend data states
  const [dashboardData, setDashboardData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for new expense
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: '',
    date: '',
    receipt: null
  });

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch employee dashboard data
        console.log('Fetching dashboard data...');
        const dashboardRes = await api.get('/employee/dashboard');
        console.log('Dashboard data received:', dashboardRes.data);
        setDashboardData(dashboardRes.data);

        // Fetch employee expenses
        console.log('Fetching expenses...');
        const expensesRes = await api.get('/employee/dashboard/expenses');
        setExpenses(expensesRes.data);

        // Fetch user profile
        const profileRes = await api.get('/auth/profile');
        setUserProfile(profileRes.data);

        // Fetch expense categories
        const categoriesRes = await api.get('/expenses/categories');
        setCategories(categoriesRes.data);

        // Fetch notifications
        const notificationsRes = await api.get('/notifications');
        setNotifications(notificationsRes.data);

      } catch (err) {
        console.error('Employee dashboard fetch error:', err);
        if (err.response?.status === 401) {
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load dashboard data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Show loading or error
  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  // Fallback for dashboardData
  const dashboard = dashboardData || {
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    monthlySpend: 0,
    expensesByCategory: [],
    monthlyTrends: [],
    recentExpenses: []
  };

  // Defensive helpers
  const safeNumber = (val) => (typeof val === 'number' && !isNaN(val) ? val : 0);
  const safeToLocaleString = (val) => safeNumber(val).toLocaleString();
  const safeArray = (val) => Array.isArray(val) ? val : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('description', newExpense.description);
      formData.append('amount', newExpense.amount);
      formData.append('category', newExpense.category);
      formData.append('date', newExpense.date);
      
      if (newExpense.receipt) {
        formData.append('receipt', newExpense.receipt);
      }

      const response = await fetch(`${API_BASE}/api/expenses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to submit expense');

      const createdExpense = await response.json();
      setExpenses([createdExpense, ...expenses]);
      setShowExpenseModal(false);
      setNewExpense({ description: '', amount: '', category: '', date: '', receipt: null });
      
      // Refresh dashboard data
      window.location.reload();
    } catch (err) {
      console.error('Error submitting expense:', err);
      setError(err.message || 'Failed to submit expense');
    }
  };

  const handleExpenseAction = async (action, expense) => {
    try {
      const token = localStorage.getItem('token');
      
      switch (action) {
        case 'edit':
          setSelectedExpense(expense);
          setNewExpense({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            date: expense.date,
            receipt: null
          });
          setShowExpenseModal(true);
          break;
          
        case 'delete':
          if (window.confirm('Are you sure you want to delete this expense?')) {
            const response = await fetch(`${API_BASE}/api/expenses/${expense.id}`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            
            if (!response.ok) throw new Error('Failed to delete expense');
            
            setExpenses(expenses.filter(e => e.id !== expense.id));
          }
          break;
          
        case 'view':
          setSelectedExpense(expense);
          // Could open a view modal here
          break;
      }
    } catch (err) {
      console.error('Error handling expense action:', err);
      setError(err.message || 'Failed to perform action');
    }
  };

  const exportData = async (type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/employee/expenses/export?type=${type}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expenses_${type}_${new Date().toISOString().split('T')[0]}.${type === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError(err.message || 'Failed to export data');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboard.totalExpenses)}</p>
            </div>
            <Receipt className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboard.pendingExpenses)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboard.approvedExpenses)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboard.monthlySpend)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Expense Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={safeArray(dashboard.monthlyTrends)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${safeToLocaleString(value)}`, 'Amount']} />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={safeArray(dashboard.expensesByCategory)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: $${safeToLocaleString(value)}`}
              >
                {safeArray(dashboard.expensesByCategory).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${safeToLocaleString(value)}`, 'Amount']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Recent Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeArray(dashboard.recentExpenses).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${safeToLocaleString(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">My Expenses</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search expenses..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Expense
          </button>
        </div>
      </div>

      {/* Expense Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600">{safeToLocaleString(dashboard.pendingExpenses)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved This Month</p>
              <p className="text-2xl font-bold text-green-600">{safeToLocaleString(dashboard.approvedExpenses)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">${safeToLocaleString(dashboard.monthlySpend)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">All Expenses</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => exportData('excel')}
              className="text-green-600 hover:text-green-800 flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>
            <button 
              onClick={() => exportData('pdf')}
              className="text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeArray(expenses).filter(expense => 
                expense?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense?.category?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{expense.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${safeToLocaleString(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleExpenseAction('view', expense)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {expense.status === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => handleExpenseAction('edit', expense)}
                            className="text-green-600 hover:text-green-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleExpenseAction('delete', expense)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Expense Analytics</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => exportData('pdf')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={safeArray(dashboard.monthlyTrends)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${safeToLocaleString(value)}`, 'Amount']} />
              <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-4">
            {safeArray(dashboard.expensesByCategory).map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] }}
                  ></div>
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">${safeToLocaleString(category.value)}</div>
                  <div className="text-xs text-gray-500">{safeToLocaleString(category.percentage)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Profile Settings</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-lg" 
                defaultValue={userProfile?.fullName || ''} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input 
                type="email" 
                className="w-full p-2 border border-gray-300 rounded-lg" 
                defaultValue={userProfile?.email || ''} 
                disabled 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-lg" 
                defaultValue={userProfile?.department || ''} 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
              <input 
                type="text" 
                className="w-full p-2 border border-gray-300 rounded-lg" 
                defaultValue={userProfile?.employeeId || ''} 
                disabled 
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="email-approval" className="rounded" defaultChecked />
              <label htmlFor="email-approval" className="text-sm text-gray-700">Email notifications for approval status</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="email-reminders" className="rounded" />
              <label htmlFor="email-reminders" className="text-sm text-gray-700">Email reminders for pending expenses</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="monthly-summary" className="rounded" defaultChecked />
              <label htmlFor="monthly-summary" className="text-sm text-gray-700">Monthly expense summary</label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Save Changes
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'expenses', label: 'My Expenses', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ZIDIO Development</h1>
                <p className="text-sm text-gray-500">Employee Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userProfile?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{userProfile?.fullName || 'User'}</span>
                <button
                  onClick={() => { logout(); navigate('/login'); }}
                  className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-200">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'expenses' && renderExpenses()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'profile' && renderProfile()}
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedExpense ? 'Edit Expense' : 'New Expense'}
            </h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input 
                  type="number" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                  required
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="receipt-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setNewExpense({...newExpense, receipt: e.target.files[0]})}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setSelectedExpense(null);
                    setNewExpense({ description: '', amount: '', category: '', date: '', receipt: null });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedExpense ? 'Update' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;