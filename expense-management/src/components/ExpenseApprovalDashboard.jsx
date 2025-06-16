/* New React component (ExpenseApprovalDashboard) for displaying expenses grouped by approval status */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ExpenseApprovalDashboard = () => {
  const [expenses, setExpenses] = useState({ approved: [], notApproved: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
         const response = await axios.get('http://localhost:8080/api/expenses/by-approval-status');
         setExpenses(response.data);
      } catch (err) {
         setError('Error fetching expenses: ' + (err.response ? err.response.data : err.message));
      }
    };
    fetchExpenses();
  }, []);

  const renderExpenseList = (list, title) => (
    <div style={{ margin: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>{title}</h2>
      {list.length === 0 ? ( <p>No expenses.</p> ) : ( list.map(exp => ( <div key={exp.id} style={{ marginBottom: '5px', padding: '5px', background: '#f9f9f9' }}> {exp.description} (Amount: {exp.amount}, Category: {exp.category}, Date: {exp.date}) </div> )))}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around' }}>
      {renderExpenseList(expenses.approved, 'Approved Expenses')}
      {renderExpenseList(expenses.notApproved, 'Non-Approved Expenses')}
      {error && ( <div style={{ color: 'red', margin: '10px' }}> {error} </div> )}
    </div>
  );
};

export default ExpenseApprovalDashboard; 