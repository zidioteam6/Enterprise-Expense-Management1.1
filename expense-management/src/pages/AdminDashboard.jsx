import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  Settings, 
  Bell, 
  Search, 
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  FileText,
  Shield,
  Clock,
  Mail,
  Building,
  CreditCard,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:8080';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Backend data states
  const [dashboardData, setDashboardData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
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
        const dashboardRes = await axios.get(`${API_BASE}/api/dashboard`);
        console.log('Dashboard data:', dashboardRes.data);
        setDashboardData(dashboardRes.data);
        // Expenses
        const expensesRes = await axios.get(`${API_BASE}/api/expenses`);
        console.log('Expenses data:', expensesRes.data);
        setExpenses(expensesRes.data);
        // Audit logs
        const auditRes = await axios.get(`${API_BASE}/api/audit/logs`);
        console.log('Audit logs data:', auditRes.data);
        setAuditLogs(auditRes.data);
        // Budget
        const budgetRes = await axios.get(`${API_BASE}/api/settings/monthly-budget`);
        console.log('Budget data:', budgetRes.data);
        setBudget(budgetRes.data.budget);
        // Users (fetch from backend)
        const token = localStorage.getItem('token');
        const usersRes = await axios.get(`${API_BASE}/api/auth/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log('Users data:', usersRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        console.error('Admin dashboard fetch error:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load admin dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Show loading or error
  if (loading) return <div className="p-8 text-center">Loading admin dashboard...</div>;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      case 'Active': return 'text-green-600 bg-green-100';
      case 'Inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleUserAction = async (action, user) => {
    switch (action) {
      case 'edit':
        setSelectedUser(user);
        setShowUserModal(true);
        break;
      case 'updateRole':
        try {
          const token = localStorage.getItem('token');
          // Remove ROLE_ prefix before sending to backend
          const roleWithoutPrefix = user.newRole.replace('ROLE_', '');
          const response = await axios.put(
            `${API_BASE}/api/auth/users/${user.id}/role`,
            { role: roleWithoutPrefix },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          
          // Update the users list with the new role
          setUsers(users.map(u => 
            u.id === user.id 
              ? { ...u, role: user.newRole }
              : u
          ));
          
          console.log('Role updated successfully:', response.data);
        } catch (error) {
          console.error('Error updating role:', error);
          setError(error?.response?.data?.message || 'Failed to update user role');
        }
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete ${user.fullName}?`)) {
          setUsers(users.filter(u => u.id !== user.id));
        }
        break;
    }
  };

  const exportData = (type) => {
    // Simulate export functionality
    alert(`Exporting ${type} data...`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboardData.totalUsers)}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboardData.totalExpenses)}</p>
            </div>
            <Receipt className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{safeToLocaleString(dashboardData.pendingApprovals)}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Spend</p>
              <p className="text-2xl font-bold text-gray-900">${safeToLocaleString(dashboardData.monthlySpend)}</p>
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
            <LineChart data={safeArray(dashboardData.monthlyTrends)}>
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
                data={safeArray(dashboardData.expensesByCategory)}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${safeToLocaleString(value)}%`}
              >
                {safeArray(dashboardData.expensesByCategory).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${safeToLocaleString(value)}%`, 'Percentage']} />
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeArray(dashboardData.recentExpenses).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.employee}</td>
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

  const renderUserManagement = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-semibold">User Management</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.filter(user => 
                (user?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (user?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
              ).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user?.fullName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user?.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <select
                      className="border border-gray-300 rounded px-2 py-1"
                      value={user.role}
                      onChange={(e) => {
                        const updatedUser = { ...user, newRole: e.target.value };
                        handleUserAction('updateRole', updatedUser);
                      }}
                    >
                      <option value="ROLE_EMPLOYEE">Employee</option>
                      <option value="ROLE_MANAGER">Manager</option>
                      <option value="ROLE_ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleUserAction('edit', user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleUserAction('delete', user)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
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
        <h2 className="text-xl font-semibold">Expense Management</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
              <p className="text-2xl font-bold text-yellow-600">156</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved This Month</p>
              <p className="text-2xl font-bold text-green-600">1,247</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-blue-600">$284,750</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">All Expenses</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeArray(dashboardData.recentExpenses).map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{expense.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{expense.employee}</td>
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
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      {expense.status === 'Pending' && (
                        <>
                          <button className="text-green-600 hover:text-green-900">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <XCircle className="h-4 w-4" />
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
        <h2 className="text-xl font-semibold">Analytics & Reports</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => exportData('analytics')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Monthly Spending Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={safeArray(dashboardData.monthlyTrends)}>
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
            {safeArray(dashboardData.expensesByCategory).map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] }}
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

      {/* Report Generation */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <FileText className="h-6 w-6 text-blue-500 mb-2" />
            <h4 className="font-medium">Monthly Report</h4>
            <p className="text-sm text-gray-500">Complete monthly expense analysis</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <PieChart className="h-6 w-6 text-green-500 mb-2" />
            <h4 className="font-medium">Category Report</h4>
            <p className="text-sm text-gray-500">Expenses broken down by category</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <BarChart3 className="h-6 w-6 text-purple-500 mb-2" />
            <h4 className="font-medium">User Activity Report</h4>
            <p className="text-sm text-gray-500">Individual user expense patterns</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">System Settings</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input type="text" className="w-full p-2 border border-gray-300 rounded-lg" defaultValue="ZIDIO Development" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC-8 (Pacific Time)</option>
                <option>UTC+0 (GMT)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Approval Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Approval Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto-approval Threshold</label>
              <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" defaultValue="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approval Levels</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>Single Level (Manager)</option>
                <option>Two Level (Manager → Finance)</option>
                <option>Three Level (Manager → Finance → Admin)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="email-notifications" className="rounded" defaultChecked />
              <label htmlFor="email-notifications" className="text-sm text-gray-700">Send email notifications for approvals</label>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="two-factor" className="rounded" />
              <label htmlFor="two-factor" className="text-sm text-gray-700">Require Two-Factor Authentication</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="password-expiry" className="rounded" defaultChecked />
              <label htmlFor="password-expiry" className="text-sm text-gray-700">Password expiry (90 days)</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input type="number" className="w-full p-2 border border-gray-300 rounded-lg" defaultValue="30" />
            </div>
          </div>
        </div>

        {/* Category Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
          <div className="space-y-3">
            {safeArray(dashboardData.expensesByCategory).map((category) => (
              <div key={category.name} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                <span className="text-sm font-medium">{category.name}</span>
                <div className="flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button className="w-full p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400">
              + Add New Category
            </button>
          </div>
        </div>
      </div>

      {/* System Actions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">System Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 text-left">
            <Activity className="h-6 w-6 text-blue-600 mb-2" />
            <h4 className="font-medium text-blue-900">System Health Check</h4>
            <p className="text-sm text-blue-700">Run diagnostics on all systems</p>
          </button>
          <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 text-left">
            <Download className="h-6 w-6 text-green-600 mb-2" />
            <h4 className="font-medium text-green-900">Backup Data</h4>
            <p className="text-sm text-green-700">Create system backup</p>
          </button>
          <button className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 text-left">
            <AlertCircle className="h-6 w-6 text-yellow-600 mb-2" />
            <h4 className="font-medium text-yellow-900">Audit Logs</h4>
            <p className="text-sm text-yellow-700">View system audit trail</p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Audit Logs</h2>
        <div className="flex gap-3">
          <select className="p-2 border border-gray-300 rounded-lg">
            <option>All Actions</option>
            <option>User Actions</option>
            <option>Expense Actions</option>
            <option>System Actions</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Export Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {safeArray(auditLogs).map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      log.status === 'SUCCESS' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                    }`}>
                      {log.status}
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'expenses', label: 'Expense Management', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'audit', label: 'Audit Logs', icon: Shield },
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
                <p className="text-sm text-gray-500">Admin Dashboard</p>
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
                  <span className="text-white text-sm font-medium">A</span>
                </div>
                <span className="text-sm font-medium text-gray-700">Admin User</span>
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
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'expenses' && renderExpenseManagement()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'audit' && renderAuditLogs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  defaultValue={selectedUser?.name || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  defaultValue={selectedUser?.email || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg">
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  defaultValue={selectedUser?.department || ''}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;