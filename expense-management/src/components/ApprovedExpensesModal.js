// ApprovedExpensesModal.js
import React from 'react';
import { Modal, Box, Typography, Grid, Divider } from '@mui/material';

const ApprovedExpensesModal = ({ open, onClose, expenses }) => {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 600,
          bgcolor: 'white',
          boxShadow: 24,
          borderRadius: 2,
          p: 4,
          overflowY: 'auto',
          maxHeight: '90vh',
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ textAlign: 'center', fontWeight: 'bold' }}>
          Approved Expenses
        </Typography>

        {expenses.length === 0 ? (
          <Typography>No approved expenses found.</Typography>
        ) : (
          expenses.map((expense, index) => (
            <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, boxShadow: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight="bold">ID:</Typography>
                  <Typography>{expense.id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight="bold">Amount:</Typography>
                  <Typography>INR {expense.amount}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight="bold">Category:</Typography>
                  <Typography>{expense.category}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" fontWeight="bold">Date:</Typography>
                  <Typography>{new Date(expense.date).toLocaleDateString()}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight="bold">Description:</Typography>
                  <Typography>{expense.description}</Typography>
                </Grid>
              </Grid>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))
        )}
      </Box>
    </Modal>
  );
};

export default ApprovedExpensesModal;
