import React, { useState, useEffect } from 'react';
import api from '../utils/axios';
import { useNotification } from '../context/NotificationContext';

const AddExpenseForm = ({ expense, onExpenseAdded, onClose }) => {
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const { addNotification } = useNotification();

  // Define the auto-approval threshold
  const AUTO_APPROVAL_THRESHOLD = 100.0;

  // Check if this is an edit operation
  const isEditMode = !!expense;

  // Define the categoryEmojis mapping to match backend
  const categoryEmojis = {
    TRAVEL: { name: 'Travel', emoji: '✈️' },
    FOOD: { name: 'Food', emoji: '🍽️' },
    OFFICE_SUPPLIES: { name: 'Office Supplies', emoji: '📦' },
    UTILITIES: { name: 'Utilities', emoji: '💡' },
    OTHER: { name: 'Other', emoji: '📝' },
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/expenses/categories');
        // Map backend codes to categoryEmojis
        const transformedCategories = Object.entries(response.data).reduce((acc, [code, name]) => {
          acc[code] = categoryEmojis[code] || { name: name, emoji: '📝' };
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

  // Initialize form data with existing expense data when editing
  useEffect(() => {
    if (expense) {
      setFormData({
        amount: expense.amount?.toString() || '',
        category: expense.category || '',
        description: expense.description || '',
        date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        priority: expense.priority || 'MEDIUM',
        attachment: null
      });
      
      // Set approval feedback for existing amount
      if (expense.amount) {
        if (expense.amount <= AUTO_APPROVAL_THRESHOLD) {
          setApprovalFeedback('This expense will be automatically approved.');
        } else {
          setApprovalFeedback('This expense will require manager approval.');
        }
      }

      // Set preview URL if expense has a receipt
      if (expense.receiptUrl) {
        setPreviewUrl(expense.receiptUrl);
      }
    }
  }, [expense]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    console.log(`Input changed: name=${name}, value=${value}`);
    if (name === 'attachment') {
      const file = files[0];
      setFormData(prev => ({ ...prev, attachment: file }));
      setSelectedFile(file);
      
      // Create preview URL for images
      if (file && file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else if (file && file.type === 'application/pdf') {
        setPreviewUrl('/pdf-icon.svg'); // Use SVG icon
      } else {
        setPreviewUrl('');
      }
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
    e.preventDefault(); // Always prevent default form submission
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        // Handle edit operation
        const updateData = {
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          date: formData.date,
          priority: formData.priority
        };

        try {
          const response = await api.put(`/expenses/${expense.id}`, updateData);
          const updatedExpense = response.data;
          try {
            onExpenseAdded(updatedExpense);
          } catch (err) {
            console.error('Error in onExpenseAdded:', err);
          }
          // More detailed notification
          addNotification(
            `Expense updated: "${updatedExpense.description}" ($${updatedExpense.amount}) - Status: ${updatedExpense.approvalStatus}`,
            updatedExpense.approvalStatus === 'APPROVED' ? 'success' : 'info'
          );
          onClose(); // Only close modal on success
        } catch (error) {
          // Enhanced error handling for edit
          console.error('Error updating expense:', error);
          if (error.response?.status === 401) {
            addNotification('Session expired. Please log in again.', 'error');
            setError('Session expired. Please log in again.');
          } else {
            const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to update expense';
            addNotification(errorMessage, 'error');
            setError(errorMessage);
          }
          return; // Don't proceed further
        }
      } else {
        // Handle new expense creation
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null) {
            formDataToSend.append(key, formData[key]);
          }
        });

        const response = await api.post('/expenses', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = response.data;
        // Handle the new response format
        const expenseData = data.expense;
        try {
          onExpenseAdded(expenseData);
        } catch (err) {
          console.error('Error in onExpenseAdded:', err);
        }
        // Show notification based on approvalStatus
        if (expenseData.approvalStatus === 'APPROVED') {
          addNotification(`Your expense for ${expenseData.description} ($${expenseData.amount}) has been automatically approved!`, 'success');
        } else {
          addNotification(`Your expense for ${expenseData.description} ($${expenseData.amount}) has been submitted and is pending approval.`, 'info');
        }
        onClose(); // Only close modal on success
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to save expense';
      addNotification(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, attachment: null }));
    setSelectedFile(null);
    setPreviewUrl('');
  };

  return (
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

      {!isEditMode && (
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Receipt/Invoice
          </label>
          <input
            type="file"
            name="attachment"
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
          />
          <p className="text-xs text-gray-500 mt-1">
            Accepted formats: PDF, JPG, JPEG, PNG, GIF (Max 10MB)
          </p>
          
          {/* File Preview */}
          {previewUrl && (
            <div className="mt-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-12 h-12 object-cover rounded mr-2"
                    />
                  ) : selectedFile?.type === 'application/pdf' ? (
                    <div className="w-12 h-12 bg-red-100 flex items-center justify-center rounded mr-2">
                      <span className="text-red-600 text-xs font-bold">PDF</span>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded mr-2">
                      <span className="text-gray-600 text-xs">FILE</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{selectedFile?.name || 'Receipt'}</p>
                    <p className="text-xs text-gray-500">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : ''}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Expense' : 'Add Expense')}
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
  );
};

export default AddExpenseForm; 