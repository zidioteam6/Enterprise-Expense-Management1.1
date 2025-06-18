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
  Paperclip,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import AddExpenseForm from './AddExpenseForm';
import { useNotification } from '../context/NotificationContext';

const API_BASE = 'http://localhost:8080';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseModalMode, setExpenseModalMode] = useState('view');

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { notifications = [], removeNotification, addNotification } = useNotification();

  // Define a mapping for categories with emojis
  const categoryEmojis = {
    FOOD: { name: 'Food', emoji: '🍔' },
    TRANSPORTATION: { name: 'Transportation', emoji: '🚗' },
    HOUSING: { name: 'Housing', emoji: '🏠' },
    UTILITIES: { name: 'Utilities', emoji: '💡' },
    ENTERTAINMENT: { name: 'Entertainment', emoji: '🎬' },
    HEALTH: { name: 'Health', emoji: '🏥' },
    EDUCATION: { name: 'Education', emoji: '📚' },
    SHOPPING: { name: 'Shopping', emoji: '🛍️' },
    SALARY: { name: 'Salary', emoji: '💰' },
    OTHER: { name: 'Other', emoji: '🤷‍♀️' },
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch expenses
        const expensesRes = await api.get('/expenses');
        console.log('Expenses data:', expensesRes.data);
        // Ensure expenses is always an array
        const expensesData = Array.isArray(expensesRes.data) ? expensesRes.data : [];
        setExpenses(expensesData);

        // Fetch categories and transform them
        const categoriesRes = await api.get('/expenses/categories');
        console.log('Categories data from backend:', categoriesRes.data);
        const transformedCategories = Object.entries(categoriesRes.data).reduce((acc, [code, name]) => {
          acc[code] = categoryEmojis[code] || { name: name, emoji: '🤷‍♀️' }; // Fallback for unknown categories
          return acc;
        }, {});
        setCategories(transformedCategories);
        console.log('Transformed categories:', transformedCategories);

        // Fetch dashboard stats
        const dashboardRes = await api.get('/dashboard');
        console.log('Dashboard data:', dashboardRes.data);
        setDashboardData(dashboardRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load dashboard data.');
        // Set expenses to empty array on error
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Show loading or error
  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  // Fallback for dashboardData
  const dashboard = dashboardData || {
    totalExpenses: 0,
    pendingExpenses: 0,
    approvedExpenses: 0,
    rejectedExpenses: 0,
    expensesByCategory: {},
    recentExpenses: [],
    monthlyExpenses: {},
    statusCounts: {},
  };

  // Defensive helpers
  const safeNumber = (val) => (typeof val === 'number' && !isNaN(val) ? val : 0);
  const safeToLocaleString = (val) => safeNumber(val).toLocaleString();
  const safeArray = (val) => Array.isArray(val) ? val : [];
  const safeObject = (val) => (typeof val === 'object' && val !== null ? val : {});

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryDisplay = (categoryCode) => {
    const category = safeObject(categories)[categoryCode];
    return category ? `${category.emoji} ${category.name}` : categoryCode;
  };

  const handleExpenseAdded = (newExpense) => {
    // Check if the expense amount is under the threshold
    const isUnderThreshold = newExpense.amount <= user.threshold;
    
    // Update the expense status based on threshold
    const updatedExpense = {
      ...newExpense,
      status: isUnderThreshold ? 'approved' : 'pending'
    };

    // Add the expense to the list - ensure expenses is always an array
    setExpenses(prev => {
      const currentExpenses = Array.isArray(prev) ? prev : [];
      return [updatedExpense, ...currentExpenses];
    });
    
    // Show appropriate notification
    if (isUnderThreshold) {
      addNotification('Expense has been auto-approved as it is under the threshold', 'success');
    } else {
      addNotification('Expense has been added and is waiting for approval', 'info');
    }

    // Close the modal
    setShowExpenseModal(false);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboard.totalExpenses)}</p>
            </div>
            <Receipt className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboard.approvedExpenses)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboard.pendingExpenses)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboard.rejectedExpenses)}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Expense Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={safeArray(dashboard.monthlyExpenses)}>
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
                label={({ name, value }) => `${name}: ${safeToLocaleString(value)}%`}
              >
                {safeArray(dashboard.expensesByCategory).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${safeToLocaleString(value)}%`, 'Percentage']} />
            </RechartsPieChart>
          </ResponsiveContainer>
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
            Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
<<<<<<< HEAD
              {safeArray(expenses)
                .filter(expense => {
                  const description = expense?.description || '';
                  const category = expense?.category || '';
                  return description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.toLowerCase().includes(searchTerm.toLowerCase());
                })
=======
              {(Array.isArray(expenses) ? expenses : [])
                .filter(expense => 
                  expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  expense.category.toLowerCase().includes(searchTerm.toLowerCase())
                )
>>>>>>> a77d46d3bb4094629e6224485eba642b84362d00
                .map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getCategoryDisplay(expense.category)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${safeToLocaleString(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.approvalStatus)}`}>
                      {expense.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => { setSelectedExpense(expense); setShowExpenseModal(true); setExpenseModalMode('view'); }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {expense.approvalStatus === 'PENDING' && (
                        <>
                          <button 
                            onClick={() => { setSelectedExpense(expense); setShowExpenseModal(true); setExpenseModalMode('edit'); }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this expense?')) {
                                try {
                                  console.log('Starting delete process for expense:', expense.id);
                                  console.log('Full expense object:', expense);
                                  
                                  // Log the exact URL being constructed
                                  const deleteUrl = `/expenses/${expense.id}`;
                                  console.log('Delete URL:', deleteUrl);
                                  console.log('Full URL with base:', `http://localhost:8080/api${deleteUrl}`);
                                  
                                  // Try with the api instance first
                                  const response = await api.delete(deleteUrl);
                                  console.log('Delete response:', response);
                                  
                                  // Update local state
                                  setExpenses(prev => {
                                    const currentExpenses = Array.isArray(prev) ? prev : [];
                                    return currentExpenses.filter(e => e.id !== expense.id);
                                  });
                                  
                                  // Update dashboard data
                                  setDashboardData(prev => ({
                                    ...prev,
                                    totalExpenses: safeNumber(prev.totalExpenses) - expense.amount,
                                    recentExpenses: prev.recentExpenses.filter(e => e.id !== expense.id)
                                  }));
                                  
                                  removeNotification(expense.id);
                                  addNotification('Expense deleted successfully!', 'success');
                                } catch (err) {
                                  console.error('Delete error details:', err);
                                  console.error('Error response:', err.response);
                                  console.error('Error status:', err.response?.status);
                                  console.error('Error data:', err.response?.data);
                                  console.error('Error config:', err.config);
                                  
                                  // If the first attempt fails, try with the full URL
                                  if (err.message === 'Network Error') {
                                    console.log('Network error detected, trying with full URL...');
                                    try {
                                      const token = localStorage.getItem('token');
                                      const fullUrl = `http://localhost:8080/api/expenses/${expense.id}`;
                                      console.log('Trying full URL:', fullUrl);
                                      
                                      const response = await fetch(fullUrl, {
                                        method: 'DELETE',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json'
                                        }
                                      });
                                      
                                      if (response.ok) {
                                        console.log('Delete successful with fetch');
                                        // Update local state
                                        setExpenses(prev => {
                                          const currentExpenses = Array.isArray(prev) ? prev : [];
                                          return currentExpenses.filter(e => e.id !== expense.id);
                                        });
                                        
                                        // Update dashboard data
                                        setDashboardData(prev => ({
                                          ...prev,
                                          totalExpenses: safeNumber(prev.totalExpenses) - expense.amount,
                                          recentExpenses: prev.recentExpenses.filter(e => e.id !== expense.id)
                                        }));
                                        
                                        removeNotification(expense.id);
                                        addNotification('Expense deleted successfully!', 'success');
                                        return;
                                      } else {
                                        const errorText = await response.text();
                                        console.error('Fetch failed with status:', response.status, errorText);
                                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                                      }
                                    } catch (fetchErr) {
                                      console.error('Fetch attempt also failed:', fetchErr);
                                      setError(`Failed to delete expense: ${fetchErr.message}`);
                                      addNotification(`Failed to delete expense: ${fetchErr.message}`, 'error');
                                      return;
                                    }
                                  }
                                  
                                  const errorMessage = err.response?.data?.message || 
                                                     err.response?.data || 
                                                     err.message || 
                                                     'Failed to delete expense';
                                  
                                  setError(errorMessage);
                                  addNotification(`Failed to delete expense: ${errorMessage}`, 'error');
                                }
                              }
                            }}
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

  const renderAnalytics = () => {
    // Transform monthlyExpenses object into an array for Recharts
    const transformedMonthlyExpenses = Object.entries(dashboard.monthlyExpenses || {}).map(([month, amount]) => ({
      month: month, // e.g., "2025-06"
      amount: safeNumber(amount)
    }));

    // Transform expensesByCategory object into an array for Recharts
    const transformedExpensesByCategory = Object.entries(dashboard.expensesByCategory || {}).map(([categoryName, amount]) => ({
      name: getCategoryDisplay(categoryName), // Use the display name with emoji
      value: dashboard.totalExpenses > 0 ? (safeNumber(amount) / dashboard.totalExpenses) * 100 : 0, // Calculate percentage
      amount: safeNumber(amount) // Keep 'amount' for category breakdown list
    }));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Analytics & Reports</h2>
          <div className="flex gap-3">
            <button
              onClick={() => exportData('pdf')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </button>
            <button
              onClick={() => exportData('xlsx')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </button>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformedMonthlyExpenses}>
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
              {transformedExpensesByCategory.map((category, index) => (
                <div key={category.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5] }}
                    ></div>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">${safeToLocaleString(category.amount)}</div>
                    <div className="text-xs text-gray-500">{safeToLocaleString(category.value)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Generation (Example buttons) */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Generate Custom Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => alert('Generating detailed monthly report...')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <FileText className="h-6 w-6 text-blue-500 mb-2" />
              <h4 className="font-medium">Detailed Monthly Report</h4>
              <p className="text-sm text-gray-500">Comprehensive overview of monthly expenses</p>
            </button>
            <button
              onClick={() => alert('Generating category spending report...')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <PieChart className="h-6 w-6 text-green-500 mb-2" />
              <h4 className="font-medium">Category Spending Report</h4>
              <p className="text-sm text-gray-500">In-depth analysis by expense category</p>
            </button>
            <button
              onClick={() => alert('Generating yearly trend report...')}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
            >
              <BarChart3 className="h-6 w-6 text-purple-500 mb-2" />
              <h4 className="font-medium">Yearly Trend Report</h4>
              <p className="text-sm text-gray-500">Visualize expense trends over the year</p>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleExpenseAction = async (action, expense) => {
    try {
      const token = localStorage.getItem('token');
      switch (action) {
        case 'view':
          setSelectedExpense(expense);
          setExpenseModalMode('view');
          setShowExpenseModal(true);
          break;
        case 'edit':
          setSelectedExpense(expense);
          setExpenseModalMode('edit');
          setShowExpenseModal(true);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete this expense?')) {
            await api.delete(`/expenses/${expense.id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            // Update the dashboardData
            setDashboardData(prev => ({
              ...prev,
              recentExpenses: prev.recentExpenses.filter(e => e.id !== expense.id)
            }));
            setExpenses(prev => prev.filter(e => e.id !== expense.id));
          }
          break;
      }
    } catch (error) {
      console.error('Error handling expense action:', error);
      setError(error?.response?.data?.message || 'Failed to perform action');
    }
  };

  const handleExpenseSubmit = async (updatedExpense) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.put(
        `/expenses/${updatedExpense.id}`,
        updatedExpense,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setDashboardData(prev => ({
        ...prev,
        recentExpenses: prev.recentExpenses.map(e => 
          e.id === updatedExpense.id ? response.data : e
        )
      }));
      setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? response.data : e));
      
      setShowExpenseModal(false);
      setSelectedExpense(null);
    } catch (error) {
      console.error('Error updating expense:', error);
      setError(error?.response?.data?.message || 'Failed to update expense');
    }
  };

  const exportData = async (format) => {
    try {
      const token = localStorage.getItem('token');
      console.log(`Attempting to export ${format}...`);
      
      const response = await api.get(`/expenses/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob', // Important for file downloads
      });
      
      console.log('Export response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data size:', response.data?.size || 'unknown');
      console.log('Response headers:', response.headers);
      
      // Check if we got a valid response
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }
      
      // Set the correct MIME type based on format
      const mimeType = format === 'pdf' ? 'application/pdf' : 
                      format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                      'application/octet-stream';
      
      // Create blob with correct MIME type
      const blob = new Blob([response.data], { type: mimeType });
      
      console.log('Created blob:', blob);
      console.log('Blob size:', blob.size);
      console.log('Blob type:', blob.type);
      
      // Create object URL
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expenses_report.${format}`);
      link.style.display = 'none';
      
      // Append to body, click, and cleanup
      document.body.appendChild(link);
      link.click();
      
      // Cleanup: remove link and revoke object URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      addNotification(`Report exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      if (error.response?.status === 404) {
        addNotification('Export feature not yet implemented on the server', 'error');
      } else {
        addNotification(error?.response?.data?.message || 'Failed to export data', 'error');
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'my-expenses', label: 'My Expenses', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
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
                  {notifications?.length > 0 && (
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
                      {notifications?.length === 0 && (
                        <div className="p-3 text-sm text-gray-500">No new notifications.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user?.fullName?.[0] || 'U'}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.fullName || 'User'}</span>
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
          {activeTab === 'my-expenses' && renderExpenses()}
          {activeTab === 'analytics' && renderAnalytics()}
          {/* Removed settings tab for now as per user request */}
        </div>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Expense</h2>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
          </div>
        </div>
      )}

      {selectedExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {expenseModalMode === 'view' ? 'View Expense' : 
                 expenseModalMode === 'edit' ? 'Edit Expense' : 'Delete Expense'}
              </h2>
              <button
                onClick={() => setSelectedExpense(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {expenseModalMode === 'view' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="font-medium">${selectedExpense.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium">{getCategoryDisplay(selectedExpense.category)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className={`font-medium ${getStatusColor(selectedExpense.approvalStatus)}`}>
                      {selectedExpense.approvalStatus}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium">{selectedExpense.description}</p>
                </div>
                {selectedExpense.receiptUrl && (
                  <div>
                    <p className="text-sm text-gray-600">Receipt</p>
                    <a 
                      href={selectedExpense.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>
            )}
            {expenseModalMode === 'edit' && (
              <AddExpenseForm 
                expense={selectedExpense}
                onExpenseAdded={handleExpenseSubmit}
              />
            )}
            {expenseModalMode === 'delete' && (
              <div className="space-y-4">
                <p>Are you sure you want to delete this expense?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setSelectedExpense(null)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleExpenseAction('delete', selectedExpense)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;