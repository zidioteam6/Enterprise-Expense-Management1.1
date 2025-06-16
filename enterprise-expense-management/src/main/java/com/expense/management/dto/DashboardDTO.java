package com.expense.management.dto;

import java.util.List;
import java.util.Map;

import lombok.Data;

@Data
public class DashboardDTO {
    private double totalExpenses;
    private double pendingExpenses;
    private double approvedExpenses;
    private double rejectedExpenses;
    private Map<String, Double> expensesByCategory;
    private List<ExpenseSummaryDTO> recentExpenses;
    private Map<String, Double> monthlyExpenses;
    private Map<String, Integer> statusCounts;
    
    @Data
    public static class ExpenseSummaryDTO {
        private Long id;
        private double amount;
        private String category;
        private String description;
        private String date;
        private String status;
        private String priority;
    }
} 