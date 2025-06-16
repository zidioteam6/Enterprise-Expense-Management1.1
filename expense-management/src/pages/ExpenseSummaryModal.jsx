import React from 'react';

const ExpenseSummaryModal = ({ expense, onClose }) => {
  if (!expense) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Expense Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <p className="mt-1 text-lg font-semibold">${expense.amount.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <p className="mt-1">{expense.category}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <p className="mt-1">{expense.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <p className="mt-1">{new Date(expense.date).toLocaleDateString()}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <p className={`mt-1 inline-flex px-2 py-1 rounded-full text-sm font-semibold ${
              expense.status === 'APPROVED'
                ? 'bg-green-100 text-green-800'
                : expense.status === 'PENDING'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {expense.status}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Priority</label>
            <p className={`mt-1 inline-flex px-2 py-1 rounded-full text-sm font-semibold ${
              expense.priority === 'HIGH'
                ? 'bg-red-100 text-red-800'
                : expense.priority === 'MEDIUM'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {expense.priority}
            </p>
          </div>

          {expense.attachment && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Attachment</label>
              <a
                href={`data:${expense.attachmentType};base64,${expense.attachment}`}
                download={`expense-${expense.id}.${expense.attachmentType.split('/')[1]}`}
                className="mt-1 text-blue-600 hover:text-blue-800"
              >
                Download Attachment
              </a>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseSummaryModal; 