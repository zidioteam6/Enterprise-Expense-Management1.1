import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Plus, Filter, Search, CheckCircle, XCircle, Clock, User, DollarSign, Calendar } from 'lucide-react';



export default function EmployeeExpense() {

    const [currentUser, setCurrentUser] = useState({
        id: 1,
        name: 'John Doe',
        role: 'employee', // employee, manager, super_manager, admin
        email: 'john.doe@company.com',
        department: 'Engineering'
    });

    const [expenses, setExpenses] = useState([
        {
            id: 1,
            employeeId: 1,
            employeeName: 'John Doe',
            department: 'Engineering',
            expenseType: 'Travel',
            amount: 1250.00,
            date: '2024-05-25',
            description: 'Business trip to client site',
            status: 'pending_manager',
            stage: 'Manager Review',
            submittedDate: '2024-05-25',
            receipt: 'receipt_001.pdf',
            managerId: 2,
            managerName: 'Alice Smith',
            comments: [],
            approvalHistory: [
                { stage: 'Submitted', date: '2024-05-25', by: 'John Doe', status: 'submitted' }
            ]
        },
        {
            id: 2,
            employeeId: 1,
            employeeName: 'John Doe',
            department: 'Engineering',
            expenseType: 'Meals',
            amount: 85.50,
            date: '2024-05-20',
            description: 'Client dinner meeting',
            status: 'approved',
            stage: 'Completed',
            submittedDate: '2024-05-20',
            receipt: 'receipt_002.pdf',
            managerId: 2,
            managerName: 'Alice Smith',
            comments: [
                { by: 'Alice Smith', role: 'Manager', comment: 'Approved - valid business expense', date: '2024-05-21' }
            ],
            approvalHistory: [
                { stage: 'Submitted', date: '2024-05-20', by: 'John Doe', status: 'submitted' },
                { stage: 'Manager Review', date: '2024-05-21', by: 'Alice Smith', status: 'approved' },
                { stage: 'Completed', date: '2024-05-21', by: 'System', status: 'approved' }
            ]
        },
        {
            id: 3,
            employeeId: 1,
            employeeName: 'John Doe',
            department: 'Engineering',
            expenseType: 'Office Supplies',
            amount: 45.75,
            date: '2024-05-18',
            description: 'Desk accessories and notebooks',
            status: 'rejected',
            stage: 'Rejected',
            submittedDate: '2024-05-18',
            receipt: 'receipt_003.pdf',
            managerId: 2,
            managerName: 'Alice Smith',
            comments: [
                { by: 'Alice Smith', role: 'Manager', comment: 'Personal items not reimbursable', date: '2024-05-19' }
            ],
            approvalHistory: [
                { stage: 'Submitted', date: '2024-05-18', by: 'John Doe', status: 'submitted' },
                { stage: 'Manager Review', date: '2024-05-19', by: 'Alice Smith', status: 'rejected' }
            ]
        }
    ]);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [newExpense, setNewExpense] = useState({
        expenseType: '',
        amount: '',
        date: '',
        description: '',
        receipt: ''
    });

    const expenseTypes = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Training', 'Equipment', 'Other'];

    const getStatusColor = (status) => {
        const colors = {
            'pending_manager': 'bg-yellow-100 text-yellow-800',
            'pending_super_manager': 'bg-blue-100 text-blue-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'draft': 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
            default: return <Clock className="w-4 h-4 text-yellow-600" />;
        }
    };

    const handleAddExpense = () => {
        const expense = {
            id: expenses.length + 1,
            employeeId: currentUser.id,
            employeeName: currentUser.name,
            department: currentUser.department,
            ...newExpense,
            amount: parseFloat(newExpense.amount),
            status: 'pending_manager',
            stage: 'Manager Review',
            submittedDate: new Date().toISOString().split('T')[0],
            managerId: 2,
            managerName: 'Alice Smith',
            comments: [],
            approvalHistory: [
                { stage: 'Submitted', date: new Date().toISOString().split('T')[0], by: currentUser.name, status: 'submitted' }
            ]
        };

        setExpenses([...expenses, expense]);
        setNewExpense({ expenseType: '', amount: '', date: '', description: '', receipt: '' });
        setShowAddModal(false);
    };

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.expenseType.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || expense.status === filterStatus;

        // Employee can only see their own expenses
        if (currentUser.role === 'employee') {
            return expense.employeeId === currentUser.id && matchesSearch && matchesFilter;
        }

        return matchesSearch && matchesFilter;
    });

    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);



    return (
        <>
            <div className="min-h-screen bg-gray-50 p-6">


                {/* Expenses Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Expense Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status & Stage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Submitted Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Current Reviewer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredExpenses.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {expense.expenseType}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                    {expense.description}
                                                </div>
                                                <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {expense.date}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                ${expense.amount.toFixed(2)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                                                    {getStatusIcon(expense.status)}
                                                    <span className="ml-1">{expense.status.replace('_', ' ').toUpperCase()}</span>
                                                </span>
                                                <div className="text-xs text-gray-500">
                                                    Stage: {expense.stage}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {expense.submittedDate}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {expense.status === 'pending_manager' ? expense.managerName :
                                                    expense.status === 'pending_super_manager' ? 'Super Manager' :
                                                        expense.status === 'approved' ? 'Completed' :
                                                            expense.status === 'rejected' ? 'Rejected' : 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {expense.status.includes('pending') ? 'Awaiting Review' : ''}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedExpense(expense);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>

                                                {currentUser.role === 'employee' && expense.status === 'draft' && (
                                                    <>
                                                        <button className="text-green-600 hover:text-green-900">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-900">
                                                            <Trash2 className="w-4 h-4" />
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

                    {filteredExpenses.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-gray-500">No expenses found</div>
                        </div>
                    )}
                </div>

                {/* Add Expense Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">Add New Expense</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Expense Type
                                    </label>
                                    <select
                                        value={newExpense.expenseType}
                                        onChange={(e) => setNewExpense({ ...newExpense, expenseType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select type...</option>
                                        {expenseTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newExpense.amount}
                                        onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newExpense.date}
                                        onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newExpense.description}
                                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        rows={3}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Receipt
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="receipt_filename.pdf"
                                        value={newExpense.receipt}
                                        onChange={(e) => setNewExpense({ ...newExpense, receipt: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={handleAddExpense}
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                                >
                                    Submit Expense
                                </button>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-400"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedExpense && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold">Expense Details</h2>
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Type</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedExpense.expenseType}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Amount</label>
                                    <p className="mt-1 text-sm text-gray-900 font-semibold">${selectedExpense.amount.toFixed(2)}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Date</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedExpense.date}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Status</label>
                                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedExpense.status)}`}>
                                        {selectedExpense.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-500">Description</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedExpense.description}</p>
                                </div>
                            </div>

                            {/* Approval History */}
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Approval History</h3>
                                <div className="space-y-3">
                                    {selectedExpense.approvalHistory.map((history, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                                            <div className={`w-3 h-3 rounded-full ${history.status === 'approved' ? 'bg-green-500' :
                                                    history.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                                }`} />
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{history.stage}</div>
                                                <div className="text-xs text-gray-500">by {history.by} on {history.date}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Comments */}
                            {selectedExpense.comments.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Comments</h3>
                                    <div className="space-y-3">
                                        {selectedExpense.comments.map((comment, index) => (
                                            <div key={index} className="p-3 bg-gray-50 rounded-md">
                                                <div className="text-sm font-medium text-gray-900">{comment.by} ({comment.role})</div>
                                                <div className="text-sm text-gray-700 mt-1">{comment.comment}</div>
                                                <div className="text-xs text-gray-500 mt-2">{comment.date}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}