// import React, { useState } from 'react';
// import axios from 'axios';

// const AddExpenseForm = ({ onAddExpense, closeForm }) => {
//   const [formData, setFormData] = useState({
//     amount: '',
//     category: '',
//     date: '',
//     description: '',
//   });
//   const [error, setError] = useState('');

//   const handleChange = (e) => {
//     setFormData({ 
//       ...formData, 
//       [e.target.name]: e.target.value 
//     });
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate inputs
//     if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0) {
//       setError('Please enter a valid amount greater than 0.');
//       return;
//     }
//     if (!formData.category.trim()) {
//       setError('Please enter a category.');
//       return;
//     }
//     if (!formData.date) {
//       setError('Please select a date.');
//       return;
//     }
//     const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(formData.date) && !isNaN(new Date(formData.date));
//     if (!isValidDate) {
//       setError('Please select a valid date (YYYY-MM-DD).');
//       return;
//     }

//     try {
//       const formattedData = {
//         ...formData,
//         amount: parseFloat(formData.amount),
//         date: new Date(formData.date).toISOString().split('T')[0],
//       };

//       console.log('Submitting expense:', formattedData);
//       const response = await axios.post('http://localhost:8080/api/expenses', formattedData);
//       console.log('API Response:', response.data);

//       const newExpense = {
//         ...response.data,
//         date: response.data.date
//           ? new Date(response.data.date).toISOString().split('T')[0]
//           : formattedData.date,
//       };

//       onAddExpense(newExpense);
//       setFormData({ amount: '', category: '', date: '', description: '' });
//       setError('');
//       closeForm();
//     } catch (error) {
//       const errorMessage = error.response
//         ? `API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`
//         : `Network Error: ${error.message}`;
//       setError(errorMessage);
//       console.error('Error adding expense:', error);
//     }
//   };

//   return (
//     <div className="add-expense-card">
//       <div className="add-expense-header">
//         <div className="flex justify-between mb-4">
//           <h2 className="text-xl font-semibold">Add New Expense</h2>
//           <button onClick={closeForm} className="text-red-500">X</button>
//         </div>
//         <p>Please fill in the details below to add your expense.</p>
//       </div>
//       {error && (
//         <div className="text-red-500 text-sm mb-4">{error}</div>
//       )}
//       <form className="add-expense-form" onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label htmlFor="amount">Amount</label>
//           <input
//             type="number"
//             name="amount"
//             placeholder="Enter amount"
//             value={formData.amount}
//             onChange={handleChange}
//             required
//             className="w-full p-2 border border-gray-300 rounded"
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="category">Category</label>
//           <input
//             type="text"
//             name="category"
//             placeholder="Enter category"
//             value={formData.category}
//             onChange={handleChange}
//             required
//             className="w-full p-2 border border-gray-300 rounded"
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="date">Date</label>
//           <input
//             type="date"
//             name="date"
//             value={formData.date}
//             onChange={handleChange}
//             required
//             className="w-full p-2 border border-gray-300 rounded"
//           />
//         </div>

//         <div className="form-group">
//           <label htmlFor="description">Description</label>
//           <input
//             type="text"
//             name="description"
//             placeholder="Enter description"
//             value={formData.description}
//             onChange={handleChange}
//             className="w-full p-2 border border-gray-300 rounded"
//           />
//         </div>

//         <button className="add-expense-button" disabled={!!error}>Add Expense</button>
//       </form>
//     </div>
//   );
// };

// export default AddExpenseForm;


