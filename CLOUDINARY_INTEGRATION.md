# Cloudinary Integration for Receipt Upload

This document explains how the Cloudinary integration works for uploading and managing expense receipts in the Enterprise Expense Management system.

## Overview

The system now supports uploading receipts (images and PDFs) to Cloudinary when creating new expenses. The receipts are stored securely in Cloudinary and can be viewed directly from the application.

## Features

- **File Upload**: Support for images (JPG, JPEG, PNG, GIF) and PDF files
- **File Validation**: Size limit of 10MB, format validation
- **Secure Storage**: Files are stored in Cloudinary with proper folder organization
- **Preview Support**: Image previews in the UI
- **Direct Access**: Receipts can be viewed directly from the application
- **Automatic Cleanup**: Receipts are deleted from Cloudinary when expenses are deleted

## Configuration

### Backend Configuration

The Cloudinary configuration is stored in `application.properties`:

```properties
# Cloudinary credentials
cloudinary.cloud-name=your_cloud_name
cloudinary.api-key=your_api_key
cloudinary.api-secret=your_api_secret
```

### Database Schema

A new column `receipt_url` has been added to the `expenses` table:

```sql
ALTER TABLE expenses ADD COLUMN receipt_url VARCHAR(500);
```

## Implementation Details

### Backend Components

1. **CloudinaryConfig.java**: Configuration bean for Cloudinary
2. **CloudinaryService.java**: Service class for handling file uploads and management
3. **ExpenseController.java**: Updated to handle receipt uploads
4. **Expense.java**: Model updated with `receiptUrl` field

### Frontend Components

1. **AddExpenseForm.jsx**: Enhanced with file upload and preview functionality
2. **ReceiptDisplay.jsx**: Reusable component for displaying receipts
3. **Dashboard.jsx**: Updated to show receipt column and handle receipt display
4. **AdminDashboard.jsx**: Updated to show receipts in admin view

## API Endpoints

### Upload Receipt
- **POST** `/api/expenses`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `amount` (required): Expense amount
  - `category` (required): Expense category
  - `description` (required): Expense description
  - `date` (required): Expense date
  - `priority` (optional): Expense priority
  - `comments` (optional): Additional comments
  - `attachment` (optional): Receipt file

### Test Cloudinary Connection
- **GET** `/api/cloudinary/test`
- Returns connection status

## File Upload Process

1. User selects a file in the expense form
2. File is validated (size, format)
3. File is uploaded to Cloudinary with specific folder structure
4. Cloudinary URL is stored in the database
5. Receipt can be viewed directly from the application

## File Management

### Upload Parameters
- **Folder**: `expense_receipts`
- **Resource Type**: `auto` (automatically detects file type)
- **Allowed Formats**: JPG, JPEG, PNG, GIF, PDF
- **Transformations**: Auto quality and format optimization

### Deletion
When an expense is deleted, the associated receipt is automatically deleted from Cloudinary using the public ID extracted from the URL.

## Security Considerations

1. **File Validation**: Only allowed file types and sizes are accepted
2. **Secure URLs**: Cloudinary provides secure HTTPS URLs
3. **Access Control**: Receipts are only accessible to authorized users
4. **Automatic Cleanup**: Files are deleted when expenses are removed

## Usage Examples

### Creating an Expense with Receipt

```javascript
const formData = new FormData();
formData.append('amount', '150.00');
formData.append('category', 'TRAVEL');
formData.append('description', 'Flight tickets');
formData.append('date', '2024-01-15');
formData.append('attachment', file); // File object

const response = await api.post('/expenses', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

### Displaying a Receipt

```jsx
import ReceiptDisplay from '../components/ReceiptDisplay';

<ReceiptDisplay receiptUrl={expense.receiptUrl} />
```

## Error Handling

The system handles various error scenarios:

1. **File too large**: Returns error message for files > 10MB
2. **Invalid format**: Returns error for unsupported file types
3. **Upload failure**: Returns detailed error message
4. **Network issues**: Graceful handling of connection problems

## Testing

To test the Cloudinary integration:

1. Start the backend application
2. Test the connection: `GET /api/cloudinary/test`
3. Create a new expense with a receipt file
4. Verify the receipt is uploaded and accessible
5. Test receipt deletion by deleting the expense

## Troubleshooting

### Common Issues

1. **Configuration Errors**: Verify Cloudinary credentials in `application.properties`
2. **File Upload Failures**: Check file size and format
3. **Display Issues**: Ensure the receipt URL is properly stored and accessible
4. **Deletion Failures**: Check Cloudinary permissions and public ID extraction

### Debug Steps

1. Check application logs for detailed error messages
2. Verify Cloudinary dashboard for uploaded files
3. Test API endpoints directly using tools like Postman
4. Check browser console for frontend errors

## Future Enhancements

Potential improvements for the Cloudinary integration:

1. **Image Optimization**: Automatic resizing and compression
2. **Multiple Receipts**: Support for multiple receipts per expense
3. **Receipt OCR**: Extract text from receipts for automatic categorization
4. **Receipt Templates**: Pre-defined receipt formats for different vendors
5. **Bulk Upload**: Support for uploading multiple receipts at once 