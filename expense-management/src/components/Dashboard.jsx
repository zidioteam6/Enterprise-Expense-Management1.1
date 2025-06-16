import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Grid,
  Typography,
  Paper,
  Card,
  CardContent,
  IconButton,
  Modal,
  Box,
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PieChartIcon from '@mui/icons-material/PieChart';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import UpdateIcon from '@mui/icons-material/Update';
import GroupIcon from '@mui/icons-material/Group';
import AddExpenseForm from './AddExpenseForm';
import ExpenseSummaryModal from './ExpenseSummaryModal';
import ApprovedExpensesModal from './ApprovedExpensesModal';
import AuditLogsModal from './AuditLogsModal';
import {  useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const Dashboard = () => {
  const [expenseData, setExpenseData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [approvedModalOpen, setApprovedModalOpen] = useState(false);
  const [auditLogsModalOpen, setAuditLogsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();


  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/expenses');
      const normalizedExpenses = response.data.map((expense) => ({
        ...expense,
        date: expense.date
          ? new Date(expense.date).toISOString().split('T')[0]
          : null,
        amount: parseFloat(expense.amount) || 0,
        category: expense.category || 'Unknown',
        description: expense.description || '',
        approval_status: expense.approval_status || 'PENDING',
      }));
      setExpenseData(normalizedExpenses);
      setError('');
      console.log('Fetched Expenses:', normalizedExpenses);
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
      const response = await axios.get('http://localhost:8080/api/audit/logs');
      console.log('Fetched audit logs:', response.data);
      // (You can store audit logs in state if AuditLogsModal uses it, or pass response.data directly.)
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
      // setApprovedModalOpen(true);
      navigate("/ExpenseResult")

    } else if (title === 'Export Report') {
      // Export report logic
      axios({
        url: 'http://localhost:8080/api/expenses/export',
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

  const chartData = {
    labels: expenseData.map((e) =>
      e.date && !isNaN(new Date(e.date))
        ? new Date(e.date).toLocaleDateString()
        : 'Invalid Date'
    ),
    datasets: [
      {
        label: 'Expenses (INR)',
        data: expenseData.map((e) => e.amount),
        backgroundColor: ['#1976d2', '#4caf50', '#ff9800', '#e91e63'],
      },
    ],
  };

  return (
    <div className="dashboard-container">
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}
      <Typography variant="h4" className="dashboard-title">
        Enterprise Expense Management Dashboard
      </Typography>

      <Grid container spacing={3} className="card-grid">
        {[
          { title: 'Expense Summary', icon: <ReceiptIcon fontSize="large" /> },
          { title: 'Create Expense', icon: <AddCircleIcon fontSize="large" /> },
          { title: 'Approve Expenses', icon: <CheckCircleIcon fontSize="large" /> },
          { title: 'Analytics & Charts', icon: <PieChartIcon fontSize="large" /> },
          { title: 'Export Report', icon: <DownloadIcon fontSize="large" /> },
          { title: 'Audit Logs', icon: <HistoryIcon fontSize="large" /> },
          { title: 'Notifications', icon: <NotificationsIcon fontSize="large" /> },
          { title: 'Real-Time Updates', icon: <UpdateIcon fontSize="large" /> },
          { title: 'User Management', icon: <GroupIcon fontSize="large" /> },
        ].map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              className="feature-card"
              elevation={3}
              onClick={() => handleCardClick(feature.title)}
              style={{ cursor: 'pointer' }}
            >
              <CardContent className="card-content">
                <IconButton color="primary">{feature.icon}</IconButton>
                <Typography variant="subtitle1">{feature.title}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper className="chart-container" elevation={4}>
        <Typography variant="h6" gutterBottom>
          Expense Overview
        </Typography>
        <Bar data={chartData} />
      </Paper>

      {/* Add Expense Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 500,
            bgcolor: 'white',
            boxShadow: 24,
            borderRadius: 2,
            p: 4,
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <AddExpenseForm onAddExpense={handleAddExpense} closeForm={() => setModalOpen(false)} />
        </Box>
      </Modal>

      {/* Expense Summary Modal */}
      <ExpenseSummaryModal
        open={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        expenses={expenseData}
      />

      {/* Pending Expenses Modal */}
      <ApprovedExpensesModal
        open={approvedModalOpen}
        onClose={() => setApprovedModalOpen(false)}
        expenses={expenseData.filter(
          (e) =>
            !e.approval_status || e.approval_status.toUpperCase() === 'PENDING'
        )}
      />

      {/* Audit Logs Modal */}
      <AuditLogsModal open={auditLogsModalOpen} onClose={() => setAuditLogsModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
