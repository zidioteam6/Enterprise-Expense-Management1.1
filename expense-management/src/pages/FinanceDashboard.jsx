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
  X,
  AlertCircle
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

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
  const [processedByFinanceExpenses, setProcessedByFinanceExpenses] = useState([]);

  // User state for settings
  const [user, setUser] = useState(null);

  // Modal state for expense viewing
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseModalMode, setExpenseModalMode] = useState('view');

  // Filter state variables
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // --- Overview Tab: Year Selector State ---
  const [overviewYear, setOverviewYear] = useState(new Date().getFullYear());

  // --- Overview Tab: Get available years from monthlyExpenses keys ---
  const availableOverviewYears = Array.from(
    new Set(
      Object.keys((dashboardData && dashboardData.monthlyExpenses) || {})
        .map((key) => {
          if (/^\d{4}-\d{2}$/.test(key)) {
            return Number(key.split('-')[0]);
          }
          return null;
        })
        .filter((year) => !!year)
    )
  ).sort((a, b) => b - a);

  // --- Analytics Tab: Year Selector State ---
  const [analyticsYear, setAnalyticsYear] = useState(new Date().getFullYear());

  // --- Analytics Tab: Get available years from monthlyExpenses keys ---
  const availableAnalyticsYears = Array.from(
    new Set(
      Object.keys((dashboardData && dashboardData.monthlyExpenses) || {})
        .map((key) => {
          if (/^\d{4}-\d{2}$/.test(key)) {
            return Number(key.split('-')[0]);
          }
          return null;
        })
        .filter((year) => !!year)
    )
  ).sort((a, b) => b - a);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const { addNotification } = useNotification();

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
        
        // Fetch processed by finance (new endpoint)
        const processedRes = await axios.get(`${API_BASE}/api/expenses/processed/finance`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        let processedData = processedRes.data;
        if (typeof processedData === 'string') {
          try { processedData = JSON.parse(processedData); } catch { processedData = []; }
        }
        if (Array.isArray(processedData)) {
          processedData = processedData.map(expense => ({
            ...expense,
            user: expense.user ? {
              id: expense.user.id,
              email: expense.user.email,
              fullName: expense.user.fullName
            } : null
          }));
        } else { processedData = []; }
        setProcessedByFinanceExpenses(processedData);
        
        // Budget
        const budgetRes = await axios.get(`${API_BASE}/api/settings/monthly-budget`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('Budget data:', budgetRes.data);
        setBudget(budgetRes.data.budget);
        
        // Get current user data for settings
        const userData = JSON.parse(localStorage.getItem('user'));
        setUser(userData);
      } catch (err) {
        console.error('Finance dashboard fetch error:', err);
        setError(err?.response?.data?.message || err.message || 'Failed to load finance dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Expose fetchData for manual refresh
    FinanceDashboard.fetchData = fetchData;
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

      // Refresh dashboard and expenses after action
      if (typeof FinanceDashboard.fetchData === 'function') {
        await FinanceDashboard.fetchData();
      }

      console.log(`Expense ${action} successfully:`, response.data);
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      setError(error?.response?.data?.message || `Failed to ${action} expense`);
    }
  };

  // Backend-powered export logic for PDF/Excel
  const exportData = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/api/expenses/export-all/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response received from server');
      }
      const mimeType = format === 'pdf' ? 'application/pdf' :
        format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
        'application/octet-stream';
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `all_expenses_report.${format}`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addNotification(`All expenses report exported successfully as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      if (error.response?.status === 404) {
        addNotification('Export feature not yet implemented on the server', 'error');
      } else if (error.response?.status === 403) {
        addNotification('Access denied. Manager or Admin role required.', 'error');
      } else {
        addNotification(error?.response?.data?.message || 'Failed to export data', 'error');
      }
    }
  };

  // Filter logic
  const filteredExpenses = expenses.filter(expense => {
    const matchesCategory = !filterCategory || expense.category === filterCategory;
    const matchesStartDate = !filterStartDate || new Date(expense.date) >= new Date(filterStartDate);
    const matchesEndDate = !filterEndDate || new Date(expense.date) <= new Date(filterEndDate);
    return matchesCategory && matchesStartDate && matchesEndDate &&
      (searchTerm === '' ||
        (expense?.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (expense?.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()));
  });

  const renderOverview = () => {
    // Transform and sort monthlyExpenses object into an array for the chart, filtered by selected year
    const transformedMonthlyExpenses = Object.entries(dashboardData.monthlyExpenses || {})
      .map(([monthKey, amount]) => {
        let year = null;
        let monthNum = monthKey;
        if (/^\d{4}-\d{2}$/.test(monthKey)) {
          const parts = monthKey.split('-');
          year = Number(parts[0]);
          monthNum = Number(parts[1]);
        } else {
          monthNum = Number(monthKey);
        }
        return {
          year,
          month: monthNum,
          amount: safeNumber(amount)
        };
      })
      .filter(entry => entry.year === overviewYear)
      .sort((a, b) => a.month - b.month);

    // Calculate correct tile values
    const totalProcessed = processedByFinanceExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : 0), 0);
    const pendingCount = expenses.filter(e => e.approvalStatus === 'PENDING').length;
    const rejectedCount = processedByFinanceExpenses.filter(e => e.approvalStatus === 'REJECTED').length;

    return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">Rs {safeToLocaleString(dashboardData.approvedExpenses)}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">Rejected Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{rejectedCount}</p>
            </div>
              <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Monthly Expense Trends</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Year:</span>
                <select
                  value={overviewYear}
                  onChange={e => setOverviewYear(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  {availableOverviewYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transformedMonthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={month => month} label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
              <YAxis />
                <Tooltip formatter={(value) => [`Rs${safeToLocaleString(value)}`, 'Amount']} labelFormatter={label => `Month: ${label}`} />
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
                label={({ name, value }) => `${name}: Rs${safeToLocaleString(value)}`}
              >
                {safeArray(Object.entries(dashboardData.expensesByCategory || {}).map(([name, value]) => ({ name, value }))).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`Rs${safeToLocaleString(value)}`, 'Amount']} />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs{safeToLocaleString(expense.amount)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '-'}</td>
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
                          onClick={() => { setSelectedExpense(expense); setShowExpenseModal(true); setExpenseModalMode('view'); }}
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
  };

  const renderExpenseManagement = () => {
    // Calculate correct tile values for expense management tab
    const pendingCount = expenses.filter(e => e.approvalStatus === 'PENDING').length;
    const now = new Date();
    const PENDING_DAYS_THRESHOLD = 7;
    const pendingLong = expenses.filter(e => {
      if (!e.createdAt || e.approvalStatus !== 'PENDING') return false;
      const submitted = new Date(e.createdAt);
      const diffDays = Math.floor((now - submitted) / (1000 * 60 * 60 * 24));
      return diffDays > PENDING_DAYS_THRESHOLD;
    });

    return (
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
          <button onClick={() => setShowFilterModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
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
              <p className="text-sm font-medium text-gray-600">Approved Expenses</p>
              <p className="text-2xl font-bold text-green-600">{
                safeToLocaleString(processedByFinanceExpenses.filter(e => e.approvalStatus === 'APPROVED').length)
              }</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending {'>'} {PENDING_DAYS_THRESHOLD} Days</p>
              <p className="text-2xl font-bold text-red-600">{pendingLong.length}</p>
              {pendingLong.length > 0 && (
                <div className="mt-2 text-xs text-gray-700">
                  {pendingLong.slice(0, 3).map((e, idx) => (
                    <span key={e.id || idx} className="block truncate">
                      {e.user?.fullName || e.user?.email || 'Unknown User'}
                    </span>
                  ))}
                  {pendingLong.length > 3 && (
                    <span className="block text-gray-500">+{pendingLong.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Expenses Table with Approval Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">All Expenses - Approval Required</h3>

        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No expenses found. Employees need to submit expenses first.
                  </td>
                </tr>
              ) : filteredExpenses.filter(e => e.approvalStatus === 'PENDING').length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No pending expenses to approve. All expenses have been processed.
                  </td>
                </tr>
              ) : (
                filteredExpenses
                  .filter(expense => expense.approvalStatus === 'PENDING')
                  .map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {expense.user ? (expense.user.fullName || expense.user.email || `User ${expense.user.id}`) : 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs{safeToLocaleString(expense.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '-'}</td>
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
                            onClick={() => { setSelectedExpense(expense); setShowExpenseModal(true); setExpenseModalMode('view'); }}
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

      {/* Processed Expenses Table */}
      <div className="bg-white rounded-lg shadow mt-8">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Processed Expenses (Approved/Rejected by You)</h3>
          <p className="text-sm text-gray-600 mt-2">
            These are expenses you have already approved or rejected. You can track their progress through the workflow.
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedByFinanceExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No processed expenses found.
                  </td>
                </tr>
              ) : (
                processedByFinanceExpenses
                  .slice() // Create a shallow copy to sort
                  .sort((a, b) => {
                    const statusOrder = { PENDING: 1, APPROVED: 2, REJECTED: 3 };
                    return (statusOrder[a.approvalStatus] || 99) - (statusOrder[b.approvalStatus] || 99);
                  })
                  .map((expense) => {
                    let statusLabel = '';
                    if (expense.approvalStatus === 'PENDING' && expense.approvalLevel === 'ADMIN') {
                      statusLabel = 'Admin Approval Pending';
                    } else if (expense.approvalStatus === 'APPROVED') {
                      statusLabel = 'Fully Approved';
                    } else if (expense.approvalStatus === 'REJECTED') {
                      statusLabel = 'Rejected';
                    } else {
                      statusLabel = expense.approvalStatus;
                    }
                    return (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {expense.user ? (expense.user.fullName || expense.user.email || `User ${expense.user.id}`) : 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{expense.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Rs{safeToLocaleString(expense.amount)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.createdAt ? new Date(expense.createdAt).toLocaleString() : '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(expense.approvalStatus)}`}>
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
  };

  const renderAnalytics = () => {
    // Transform and sort monthlyExpenses for Recharts, filtered by selected year
    const transformedMonthlyExpenses = Object.entries(dashboardData?.monthlyExpenses || {})
      .map(([monthKey, amount]) => {
        let year = null;
        let monthNum = monthKey;
        if (/^\d{4}-\d{2}$/.test(monthKey)) {
          const parts = monthKey.split('-');
          year = Number(parts[0]);
          monthNum = Number(parts[1]);
        } else {
          monthNum = Number(monthKey);
        }
        return {
          year,
          month: monthNum,
          amount: safeNumber(amount)
        };
      })
      .filter(entry => entry.year === analyticsYear)
      .sort((a, b) => a.month - b.month);

    // Transform expensesByCategory object into an array for Recharts
    const transformedExpensesByCategory = Object.entries(dashboardData?.expensesByCategory || {}).map(([categoryName, amount]) => ({
      name: categoryName,
      value: dashboardData?.totalExpenses > 0 ? (safeNumber(amount) / dashboardData.totalExpenses) * 100 : 0,
      amount: safeNumber(amount)
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Monthly Spending Trend</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Year:</span>
                <select
                  value={analyticsYear}
                  onChange={e => setAnalyticsYear(Number(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  {availableAnalyticsYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
        </div>
            </div>
          <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transformedMonthlyExpenses}>
              <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={month => month} label={{ value: 'Month', position: 'insideBottom', offset: -5 }} />
              <YAxis />
                <Tooltip formatter={(value) => [`Rs${safeToLocaleString(value)}`, 'Amount']} labelFormatter={label => `Month: ${label}`} />
                <Bar dataKey="amount" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
          <div className="bg-white p-6 rounded-lg shadow lg:col-span-1">
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
                    <div className="text-sm font-semibold">Rs{safeToLocaleString(category.amount)}</div>
                    <div className="text-xs text-gray-500">{safeToLocaleString(category.value)}%</div>
                  </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderSettings = () => (
    <div className="space-y-8 max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">🔐 Account & Profile Settings</h2>
      {/* Profile Card */}
      <div className="flex items-center gap-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow p-6 mb-4">
        <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-3xl font-bold text-white">
          {user?.fullName?.[0] || 'U'}
      </div>
        <div className="flex-1">
          <div className="text-xl font-semibold text-gray-900">{user?.fullName || 'N/A'}</div>
          <div className="text-gray-600">{user?.email || 'N/A'}</div>
          <div className="text-sm text-blue-700 mt-1">{user?.role ? user.role.replace('ROLE_', '') : 'Finance'}</div>
          <div className="text-xs text-gray-400 mt-1">Joined: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
        </div>
            </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-medium mb-2">Personal Information</h3>
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="w-32 text-gray-600 font-medium">Name:</label>
              <span className="text-gray-900">{user?.fullName || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="w-32 text-gray-600 font-medium">Email:</label>
              <span className="text-gray-900">{user?.email || 'N/A'}</span>
          </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="w-32 text-gray-600 font-medium">Phone:</label>
              <span className="text-gray-900">(not set)</span>
          </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="w-32 text-gray-600 font-medium">Address:</label>
              <span className="text-gray-900">(not set)</span>
        </div>
      </div>
        </div>
        {/* Authentication Settings */}
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h3 className="text-lg font-medium mb-2">Authentication Settings</h3>
          {/* Only show change password if user.provider is not set or is 'local' */}
          {(!user?.provider || user?.provider === 'local') ? (
            <ChangePasswordPanel user={user} addNotification={addNotification} />
          ) : (
            <div className="text-gray-500 text-sm">Password change is not available for social login accounts.</div>
          )}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-1">Security Tips</h4>
            <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
              <li>Use a strong, unique password for your account.</li>
              <li>Never share your password with anyone.</li>
              <li>Change your password regularly.</li>
              <li>Enable two-factor authentication if available.</li>
            </ul>
              </div>
            </div>
      </div>
      {/* Divider */}
      <div className="border-t my-8"></div>
      {/* Account Actions */}
      <div className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
          <h3 className="text-lg font-medium mb-2">Account Actions</h3>
          <p className="text-sm text-gray-500">You can log out or request account deletion below.</p>
              </div>
        <div className="flex gap-3 mt-2 md:mt-0">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Log Out
          </button>
          <button
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded cursor-not-allowed opacity-60"
            disabled
            title="Account deletion is not available yet."
          >
            Delete Account
              </button>
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
                <span className="text-sm font-medium text-gray-700">Finance Manager </span>
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

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg relative">
            <button onClick={() => setShowFilterModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input type="text" className="w-full border rounded p-2" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} placeholder="e.g. TRAVEL" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full border rounded p-2" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full border rounded p-2" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => { setFilterCategory(''); setFilterStartDate(''); setFilterEndDate(''); }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">Clear</button>
                <button onClick={() => setShowFilterModal(false)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && selectedExpense && expenseModalMode === 'view' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">View Expense Details</h2>
              <button
                onClick={() => { setShowExpenseModal(false); setSelectedExpense(null); }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="font-medium">Rs{selectedExpense.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="font-medium">{selectedExpense.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-medium ${getStatusColor(selectedExpense.approvalStatus)}`}>{selectedExpense.approvalStatus}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{selectedExpense.description}</p>
              </div>
              {selectedExpense.receiptUrl && (
                <div>
                  <p className="text-sm text-gray-600">Receipt</p>
                  <a href={selectedExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Receipt</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ChangePasswordPanel component
function ChangePasswordPanel({ user, addNotification }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/change-password`, {
        currentPassword,
        newPassword
      });
      setSuccess('Password changed successfully!');
      addNotification('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowForm(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!showForm ? (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          Change Password
        </button>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" className="mt-1 w-full border rounded px-3 py-2" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
            <button
              type="button"
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              onClick={() => { setShowForm(false); setError(''); setSuccess(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default FinanceDashboard; 