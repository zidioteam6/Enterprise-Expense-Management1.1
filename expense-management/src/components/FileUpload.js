// import React, { useState } from 'react';
// import axios from 'axios';

// const FileUpload = () => {
//   const [file, setFile] = useState(null);
//   const [amount, setAmount] = useState('');
//   const [category, setCategory] = useState('');
//   const [description, setDescription] = useState('');
//   const [date, setDate] = useState('');
//   const [message, setMessage] = useState('');

//   // Handle file change
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   // Handle form data
//   const handleFormSubmit = async (e) => {
//     e.preventDefault();

//     const formData = new FormData();
//     formData.append('amount', amount);
//     formData.append('category', category);
//     formData.append('description', description);
//     formData.append('date', date);
//     if (file) {
//       formData.append('attachment', file);
//     }

//     try {
//       // Post the form data to the backend
//       const response = await axios.post('http://localhost:8080/api/expenses', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data', // This is important
//         },
//       });

//       setMessage(response.data); // Show success message from the backend
//     } catch (error) {
//       console.error(error);
//       setMessage('Error uploading expense.');
//     }
//   };

//   return (
//     <div className="file-upload-container">
//       <h2>Add New Expense</h2>
//       <p>Please fill in the details below to add your expense.</p>
//       <form onSubmit={handleFormSubmit}>
//         <div>
//           <label>Amount</label>
//           <input
//             type="number"
//             value={amount}
//             onChange={(e) => setAmount(e.target.value)}
//             placeholder="Enter amount"
//             required
//           />
//         </div>
//         <div>
//           <label>Category</label>
//           <input
//             type="text"
//             value={category}
//             onChange={(e) => setCategory(e.target.value)}
//             placeholder="Enter category"
//             required
//           />
//         </div>
//         <div>
//           <label>Date (dd/mm/yyyy)</label>
//           <input
//             type="date"
//             value={date}
//             onChange={(e) => setDate(e.target.value)}
//             required
//           />
//         </div>
//         <div>
//           <label>Description</label>
//           <input
//             type="text"
//             value={description}
//             onChange={(e) => setDescription(e.target.value)}
//             placeholder="Enter description"
//             required
//           />
//         </div>
//         <div>
//           <label>Attach Invoice (optional)</label>
//           <input type="file" onChange={handleFileChange} />
//         </div>
//         <button type="submit">Add Expense</button>
//       </form>
//       {message && <p>{message}</p>}
//     </div>
//   );
// };

// export default FileUpload;
