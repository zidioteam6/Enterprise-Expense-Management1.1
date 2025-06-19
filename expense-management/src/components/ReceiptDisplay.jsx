import React from 'react';

const ReceiptDisplay = ({ receiptUrl, className = "" }) => {
  if (!receiptUrl) {
    return null;
  }

  const isPdf = receiptUrl.toLowerCase().includes('.pdf');

  return (
    <div className={className}>
      {isPdf ? (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-100 flex items-center justify-center rounded">
            <span className="text-red-600 text-xs font-bold">PDF</span>
          </div>
          <a 
            href={receiptUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            View Receipt
          </a>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <img 
            src={receiptUrl} 
            alt="Receipt" 
            className="w-6 h-6 object-cover rounded"
          />
          <a 
            href={receiptUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            View Receipt
          </a>
        </div>
      )}
    </div>
  );
};

export default ReceiptDisplay; 