//working propely addexpesneform


import React, { useState } from 'react';
import axios from 'axios';

const  AddExpenseForm = ({ onAddExpense, closeForm }) => {
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    // date: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
    setError('');
  };

  const handleFileChange = (e) => {
    setInvoice(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!formData.amount || isNaN(formData.amount) || formData.amount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }
    if (!formData.category.trim()) {
      setError('Please enter a category.');
      return;
    }
    if (!formData.date) {
      setError('Please select a date.');
      return;
    }
    const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(formData.date) && !isNaN(new Date(formData.date));
    if (!isValidDate) {
      setError('Please select a valid date (YYYY-MM-DD).');
      return;
    }

    try {
      const expenseData = new FormData();
      expenseData.append('amount', formData.amount);
      expenseData.append('category', formData.category);
      // expenseData.append('date', formData.date);
      expenseData.append('description', formData.description);
      if (invoice) {
        expenseData.append('invoice', invoice);
      }

        const response = await axios.post('http://localhost:8080/api/expenses', expenseData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

      onAddExpense(response.data);
      setFormData({ amount: '', category: '', date: '', description: '' });
      setInvoice(null);
      setError('');
      closeForm();
    } catch (error) {
      const errorMessage = error.response
        ? `API Error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`
        : `Network Error: ${error.message}`;
      setError(errorMessage);
      console.error('Error adding expense:', error);
    }
  };

  return (
    <div className="add-expense-card">
      <div className="add-expense-header">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Add New Expense</h2>
          <button onClick={closeForm} className="text-red-500">X</button>
        </div>
        <p>Please fill in the details below to add your expense.</p>
      </div>
      {error && (
        <div className="text-red-500 text-sm mb-4">{error}</div>
      )}
      <form className="add-expense-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="amount">Amount</label>
          <input
            type="number"
            name="amount"
            placeholder="Enter amount"
            value={formData.amount}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <input
            type="text"
            name="category"
            placeholder="Enter category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            name="description"
            placeholder="Enter description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="form-group">
          <label htmlFor="invoice">Attach Invoice (PDF/Image) <span className="text-sm text-gray-400">(Optional)</span></label>
          <input
            type="file"
            name="invoice"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded file-input"
          />
        </div>

        <button className="p-3 border-spacing-1 bg-blue-500 text-white" >Add Expense</button>
      </form>
    </div>
    );
};

export default AddExpenseForm;















// // new with invocies
// import React, { useState } from 'react';
// import axios from 'axios';

// const AddExpenseForm = ({ onAddExpense, closeForm }) => {
//   const [formData, setFormData] = useState({
//     amount: '',
//     category: '',
//     date: '',
//     description: '',
//   });

//   const [invoice, setInvoice] = useState(null); // NEW: to store file

//   const handleChange = (e) => {
//     setFormData({ 
//       ...formData, 
//       [e.target.name]: e.target.value 
//     });
//   };

//   const handleFileChange = (e) => {
//     setInvoice(e.target.files[0]); // NEW: handle invoice file
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const expenseData = new FormData(); // NEW: use FormData for file upload
//       expenseData.append('amount', formData.amount);
//       expenseData.append('category', formData.category);
//       expenseData.append('date', formData.date);
//       expenseData.append('description', formData.description);
//       if (invoice) {
//         expenseData.append('invoice', invoice); // optional
//       }

//       const response = await axios.post('http://localhost:8080/api/expenses', expenseData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });

//       onAddExpense(response.data);
//       closeForm();
//     } catch (error) {
//       alert('Error adding expense');
//       console.error(error);
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded shadow-md max-w-md w-full">
//       <div className="flex justify-between mb-4">
//         <h2 className="text-xl font-semibold">Add New Expense</h2>
//         <button onClick={closeForm} className="text-red-500">X</button>
//       </div>
//       <p>Please fill in the details below to add your expense.</p>
//       <form className="mt-4" onSubmit={handleSubmit}>
//         <div className="form-group mb-4">
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

//         <div className="form-group mb-4">
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

//         <div className="form-group mb-4">
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

//         <div className="form-group mb-4">
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

//         {/* NEW: Attached Invoice Field */}
//         <div className="form-group mb-4">
//           <label htmlFor="invoice">Attach Invoice (PDF/Image) <span className="text-sm text-gray-400">(Optional)</span></label>
//           <input
//             type="file"
//             name="invoice"
//             accept=".pdf,image/*"
//             onChange={handleFileChange}
//             className="w-full p-2 border border-gray-300 rounded file-input"
//           />
//         </div>

//         <button className="w-full bg-blue-500 text-white p-2 rounded">Add Expense</button>
//       </form>
//     </div>
//   );
// };

// export default AddExpenseForm;
