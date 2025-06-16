import React, { useEffect, useState } from 'react';
import { Check, X, Eye, Calendar, DollarSign, User, FileText, IndianRupee  } from 'lucide-react';
import axios from 'axios';


const ExpenseResult = () => {
  const [expenses, setExpenses] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/expenses");
        const data = await response.json();
        console.log("Fetched Data:", data);
        setExpenses(data);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setExpenses([]);
      }
    };

    const getUser = async () => {
      try {
        const mail = localStorage.getItem('userEmail');
        console.log('mail - ', mail);
        
        if (!mail) {
          console.error('No user email found in localStorage');
          return;
        }

        const res = await fetch(`http://localhost:8080/api/auth/userEmail?email=${encodeURIComponent(mail)}`, {
          method: "GET",
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch user data');
        }

        const userData = await res.json();
        console.log('User data:', userData);
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        // You might want to show an error message to the user here
      }
    };

    fetchExpenses();
    getUser();
  }, []);

  const [selectedExpense, setSelectedExpense] = useState(null);


  const [success, setSuccess] = useState(false);

const handleApprove = async (id) => {
  try {
    const res = await fetch(`http://localhost:8080/api/expenses/${id}/approve`, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error("Failed to approve expense.");
    }

    const data = await res.text(); // you're returning a plain string, not JSON
    console.log(data);

    if (data === "updated!") {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }

  } catch (error) {
    console.error("Approval failed:", error);
  }


  window.location.reload(false);
};



  const handleReject = (expenseId) => {
    setExpenses(expenses.map(expense => 
      expense.id === expenseId 
        ? { ...expense, status: 'Rejected' }
        : expense
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-500';
      case 'Medium': return 'bg-yellow-500';
      case 'Low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Expense Approval Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">Review and manage employee expense requests</p>
        </div>

        {success && (
        <div className="mt-4 text-green-600 font-semibold">
          ✅ Action completed successfully!
        </div>
      )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expense ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(expense.priority)}`} title={expense.priority}></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{expense.id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8">
                        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{expense.user.fullName }</div>
                        {/* <div className="text-sm text-gray-500">{expense.department}</div> */}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={expense.description}>
                      {expense.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      {/* <DollarSign className="w-4 h-4 mr-1" /> */}
                      <IndianRupee className="w-4 h-4 mr-1"/>
                      {expense.amount}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-1" />
                      {expense.date}
                    </div>
                    <div className="text-xs text-gray-500">
                      Submitted: {expense.submittedDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.approvalStatus)}`}>
                      {expense.approvalLevel}_{expense.approvalStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-1" />
                      {expense.receipts}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedExpense(expense)}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {currentUser && expense.approvalLevel === currentUser.role && 
                       (
                        <>
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(expense.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
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

        {expenses.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No expense requests</h3>
            <p className="mt-1 text-sm text-gray-500">There are no pending expense requests to review.</p>
          </div>
        )}
      </div>

      {selectedExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Expense Details</h3>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Expense ID</label>
                  <p className="text-sm text-gray-900">{selectedExpense.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employee</label>
                  <p className="text-sm text-gray-900">{selectedExpense.employeeName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-sm text-gray-900">{selectedExpense.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Category</label>
                  <p className="text-sm text-gray-900">{selectedExpense.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm text-gray-900">${selectedExpense.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900">{selectedExpense.date}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm text-gray-900">{selectedExpense.description}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              {selectedExpense.status === 'Pending' && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedExpense.id);
                      setSelectedExpense(null);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedExpense.id);
                      setSelectedExpense(null);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedExpense(null)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseResult;