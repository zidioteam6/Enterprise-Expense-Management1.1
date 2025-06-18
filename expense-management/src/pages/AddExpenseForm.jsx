import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useNotification } from '../context/NotificationContext';

const AddExpenseForm = ({ onExpenseAdded, onClose }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
    attachment: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState({});
  const [approvalFeedback, setApprovalFeedback] = useState('');

  const { addNotification } = useNotification();

  // Define the auto-approval threshold
  const AUTO_APPROVAL_THRESHOLD = 100.0;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/expenses/categories');
        // Assuming response.data is a map of code to name, e.g., { "FOOD": "Food" }
        const transformedCategories = Object.entries(response.data).reduce((acc, [code, name]) => {
          // You might want a more robust way to get emojis or fetch them from backend
          acc[code] = { name: name, emoji: '🤷‍♀️' }; // Placeholder emoji
          return acc;
        }, {});
        setCategories(transformedCategories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setError('Failed to load expense categories');
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    console.log(`Input changed: name=${name}, value=${value}`);
    if (name === 'attachment') {
      setFormData(prev => ({ ...prev, attachment: files[0] }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      console.log('Updated formData:', { ...formData, [name]: value });
      if (name === 'amount') {
        const amountValue = parseFloat(value);
        if (!isNaN(amountValue)) {
          if (amountValue <= AUTO_APPROVAL_THRESHOLD) {
            setApprovalFeedback('This expense will be automatically approved.');
          } else {
            setApprovalFeedback('This expense will require manager approval.');
          }
        } else {
          setApprovalFeedback(''); // Clear feedback if amount is not a valid number
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null) {
          // Fix: backend expects 'receipt' not 'attachment'
          if (key === 'attachment') {
            formDataToSend.append('receipt', formData[key]);
          } else {
            formDataToSend.append(key, formData[key]);
          }
        }
      });

      const response = await api.post('/expenses', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      onExpenseAdded(data.expense);
      
      // Show success message as a notification
      const message = data.expense.approvalStatus === 'APPROVED' 
        ? `Your expense for ${data.expense.description} ($${data.expense.amount}) has been automatically approved!` 
        : `Your expense for ${data.expense.description} ($${data.expense.amount}) has been submitted and is pending approval.`;
      addNotification(message, 'success');
      
      onClose();
    } catch (error) {
      console.error('Error submitting expense:', error);
      const errorMessage = error.response?.data?.error || 'Failed to add expense';
      addNotification(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add New Expense</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
              min="0"
              step="0.01"
            />
            {approvalFeedback && (
              <p className={`text-sm mt-2 ${
                approvalFeedback.includes('automatically approved') ? 'text-green-600' : 'text-orange-600'
              }`}>
                {approvalFeedback}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select a category</option>
              {Object.entries(categories).map(([key, catInfo]) => (
                <option key={key} value={key}>
                  {catInfo.emoji} {catInfo.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Attachment
            </label>
            <input
              type="file"
              name="attachment"
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseForm; 