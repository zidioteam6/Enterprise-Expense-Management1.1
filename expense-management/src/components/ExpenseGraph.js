import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const ExpenseGraph = ({ expenses }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      const chartData = {
        labels: expenses.map((exp) =>
          exp.date && !isNaN(new Date(exp.date))
            ? new Date(exp.date).toLocaleDateString()
            : 'Invalid Date'
        ),
        datasets: [
          {
            label: 'Expenses',
            data: expenses.map((exp) => exp.amount),
            backgroundColor: 'rgba(159, 122, 234, 0.5)',
            borderColor: 'rgba(159, 122, 234, 1)',
            borderWidth: 1,
          },
        ],
      };

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [expenses]);

  return <canvas ref={chartRef} />;
};

export default ExpenseGraph;