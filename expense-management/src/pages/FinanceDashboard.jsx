import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  TrendingUp, 
  Settings, 
  Building,
  Bell, 
  Search, 
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  BarChart3,
  Clock,
  Check,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Backend data states
  const [dashboardData, setDashboardData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Dashboard stats
        const dashboardRes = await axios.get(`${API_BASE}/api/dashboard`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Dashboard data:', dashboardRes.data);
        setDashboardData(dashboardRes.data);
        
        // Get expenses pending finance approval only (approved by manager)
        const expensesRes = await axios.get(`${API_BASE}/api/expenses/pending/finance`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Finance pending expenses data:', expensesRes.data);
        console.log('Type of expenses data:', typeof expensesRes.data);
        console.log('Is array?', Array.isArray(expensesRes.data));
        
        // Handle different response formats
        let expensesData = expensesRes.data;
        
        // If it's a string, try to parse it (handles circular references)
        if (typeof expensesData === 'string') {
          try {
            expensesData = JSON.parse(expensesData);
          } catch (parseError) {
            console.error('Failed to parse expenses data:', parseError);
            expensesData = [];
          }
        }
        
        // If it's already an array, use it directly
        if (Array.isArray(expensesData)) {
          // Clean the data to remove circular references
          expensesData = expensesData.map(expense => ({
            ...expense,
            user: expense.user ? {
              id: expense.user.id,
              email: expense.user.email,
              fullName: expense.user.fullName
            } : null
          }));
        } else {
          expensesData = [];
        }
        
        console.log('Processed finance pending expenses data:', expensesData);
        console.log('Number of expenses pending finance approval:', expensesData.length);
        setExpenses(expensesData);
        
        // Budget
        const budgetRes = await axios.get(`${API_BASE}/api/settings/monthly-budget`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Budget data:', budgetRes.data);
        setBudget(budgetRes.data.budget);
      } catch (err) {
        console.error('Finance dashboard fetch error:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load finance dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Show loading or error
  if (loading) return <div className="p-8 text-center">Loading manager dashboard...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  // Defensive helpers
  const safeNumber = (val) => (typeof val === 'number' && !isNaN(val) ? val : 0);
  const safeToLocaleString = (val) => safeNumber(val).toLocaleString();
  const safeArray = (val) => Array.isArray(val) ? val : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600 bg-green-100';
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleExpenseAction = async (action, expense) => {
    try {
      let endpoint = '';
      let method = 'PUT';

      switch (action) {
        case 'approve':
          endpoint = `${API_BASE}/api/expenses/${expense.id}/approve`;
          break;
        case 'reject':
          endpoint = `${API_BASE}/api/expenses/${expense.id}/reject`;
          break;
        default:
          return;
      }

      const response = await axios({
        method,
        url: endpoint,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Update the expenses list
      setExpenses(expenses.map(e => 
        e.id === expense.id 
          ? { ...e, approvalStatus: action === 'approve' ? 'APPROVED' : 'REJECTED' }
          : e
      ));

      console.log(`Expense ${action} successfully:`, response.data);
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      setError(error?.response?.data?.message || `Failed to ${action} expense`);
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
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboardData.totalExpenses)}</p>
            </div>
            <Receipt className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboardData.approvedExpenses)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboardData.pendingExpenses)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Spend</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboardData.monthlyExpenses ? Object.values(dashboardData.monthlyExpenses).reduce((sum, val) => sum + val, 0) : 0)}</p>
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
            <LineChart data={safeArray(Object.entries(dashboardData.monthlyExpenses || {}).map(([month, amount]) => ({ month, amount })))}>
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
                data={safeArray(Object.entries(dashboardData.expensesByCategory || {}).map(([name, value]) => ({ name, value })))}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: $${safeToLocaleString(value)}`}
              >
                {safeArray(Object.entries(dashboardData.expensesByCategory || {}).map(([name, value]) => ({ name, value }))).map((entry, index) => (
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.slice(0, 5).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {expense.user ? (expense.user.fullName || `User ${expense.user.id}`) : 'Unknown User'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${safeToLocaleString(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.approvalStatus)}`}>
                      {expense.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {expense.approvalStatus === 'PENDING'  && (
                        <>
                          <button 
                            onClick={() => handleExpenseAction('approve', expense)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </button>
                          <button 
                            onClick={() => handleExpenseAction('reject', expense)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {/* View details */}}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
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

  const renderExpenseManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Expense Management & Approval</h2>
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
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Advanced Filters
          </button>
        </div>
      </div>

      {/* Expense Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-600">{safeToLocaleString(dashboardData.pendingExpenses)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved This Month</p>
              <p className="text-2xl font-bold text-green-600">{safeToLocaleString(dashboardData.approvedExpenses)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected This Month</p>
              <p className="text-2xl font-bold text-red-600">{safeToLocaleString(dashboardData.rejectedExpenses)}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Expenses Table with Approval Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">All Expenses - Approval Required</h3>
          <p className="text-sm text-gray-600 mt-2">
            Total expenses: {expenses.length} | Pending: {expenses.filter(e => e.approvalStatus === 'PENDING').length} | 
            Approved: {expenses.filter(e => e.approvalStatus === 'APPROVED').length} | 
            Rejected: {expenses.filter(e => e.approvalStatus === 'REJECTED').length}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No expenses found. Employees need to submit expenses first.
                  </td>
                </tr>
              ) : expenses.filter(e => e.approvalStatus === 'PENDING').length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No pending expenses to approve. All expenses have been processed.
                  </td>
                </tr>
              ) : (
                expenses
                  .filter(expense => expense.approvalStatus === 'PENDING')
                  .filter(expense => 
                    searchTerm === '' || 
                    (expense?.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                    (expense?.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                  )
                  .map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.user ? (expense.user.email || `User ${expense.user.id}`) : 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${safeToLocaleString(expense.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.approvalStatus)}`}>
                          {expense.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {expense.approvalStatus === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleExpenseAction('approve', expense)}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </button>
                              <button 
                                onClick={() => handleExpenseAction('reject', expense)}
                                className="text-red-600 hover:text-red-900 flex items-center gap-1"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                                Reject
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => {/* View details */}}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Analytics & Reports</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Expense Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={safeArray(Object.entries(dashboardData.monthlyExpenses || {}).map(([month, amount]) => ({ month, amount })))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${safeToLocaleString(value)}`, 'Amount']} />
              <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={safeArray(Object.entries(dashboardData.expensesByCategory || {}).map(([name, value]) => ({ name, value })))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${safeToLocaleString(value)}`, 'Amount']} />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Expense Categories</h3>
          <div className="space-y-3">
            {safeArray(Object.entries(dashboardData.expensesByCategory || {}).map(([name, value]) => ({ name, value }))).slice(0, 5).map((category, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{category.name}</span>
                <span className="text-sm font-medium">${safeToLocaleString(category.value)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Approval Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="text-sm font-medium text-green-600">{safeToLocaleString(dashboardData.approvedExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="text-sm font-medium text-yellow-600">{safeToLocaleString(dashboardData.pendingExpenses)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rejected</span>
              <span className="text-sm font-medium text-red-600">{safeToLocaleString(dashboardData.rejectedExpenses)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">Settings</h2>
      </div>

      {/* Budget Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Monthly Budget Settings</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget Limit</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter monthly budget"
                defaultValue={budget || 0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Alert Threshold (%)</label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="80"
                defaultValue="80"
              />
            </div>
          </div>
          <div className="mt-6">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Notification Settings</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-500">Receive notifications for expense approvals</p>
              </div>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Enable
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Budget Alerts</h4>
                <p className="text-sm text-gray-500">Get notified when budget threshold is reached</p>
              </div>
              <button className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                Disable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'expenses', label: 'Expense Management', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
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
                <p className="text-sm text-gray-500">Finance Manager Dashboard</p>
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
                  <span className="text-white text-sm font-medium">M</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Finance Manager {JSON.parse(localStorage.getItem('user')).fullName}</span>
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
          {activeTab === 'expenses' && renderExpenseManagement()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard; 