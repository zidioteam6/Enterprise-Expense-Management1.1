import React from 'react';
import { Modal, Box, Typography, Divider, Grid } from '@mui/material';

const ExpenseSummaryModal = ({ open, onClose, expenses }) => {
  console.log('Expenses in Modal:', expenses);

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
          Expense Summary
        </Typography>

        {expenses.length === 0 ? (
          <Typography>No expenses recorded yet.</Typography>
        ) : (
          expenses.map((expense, index) => (
            <Box
              key={index}
              sx={{
                mb: 2,
                p: 2,
                border: '1px solid #ddd',
                borderRadius: 1,
                boxShadow: 2,
              }}
            >
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Category:
                  </Typography>
                  <Typography variant="body2">{expense.category || 'N/A'}</Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Amount:
                  </Typography>
                  <Typography variant="body2">INR {expense.amount || 0}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Description:
                  </Typography>
                  <Typography variant="body2">{expense.description || 'N/A'}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Date:
                  </Typography>
                  <Typography variant="body2">
                    {expense.date && !isNaN(new Date(expense.date))
                      ? new Date(expense.date).toLocaleDateString()
                      : 'Invalid Date'}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 1 }} />
            </Box>
          ))
        )}
      </Box>
    </Modal>
  );
};

export default ExpenseSummaryModal;
