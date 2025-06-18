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
    
    // Getters and Setters for DashboardDTO
    public double getTotalExpenses() { return totalExpenses; }
    public void setTotalExpenses(double totalExpenses) { this.totalExpenses = totalExpenses; }
    
    public double getPendingExpenses() { return pendingExpenses; }
    public void setPendingExpenses(double pendingExpenses) { this.pendingExpenses = pendingExpenses; }
    
    public double getApprovedExpenses() { return approvedExpenses; }
    public void setApprovedExpenses(double approvedExpenses) { this.approvedExpenses = approvedExpenses; }
    
    public double getRejectedExpenses() { return rejectedExpenses; }
    public void setRejectedExpenses(double rejectedExpenses) { this.rejectedExpenses = rejectedExpenses; }
    
    public Map<String, Double> getExpensesByCategory() { return expensesByCategory; }
    public void setExpensesByCategory(Map<String, Double> expensesByCategory) { this.expensesByCategory = expensesByCategory; }
    
    public List<ExpenseSummaryDTO> getRecentExpenses() { return recentExpenses; }
    public void setRecentExpenses(List<ExpenseSummaryDTO> recentExpenses) { this.recentExpenses = recentExpenses; }
    
    public Map<String, Double> getMonthlyExpenses() { return monthlyExpenses; }
    public void setMonthlyExpenses(Map<String, Double> monthlyExpenses) { this.monthlyExpenses = monthlyExpenses; }
    
    public Map<String, Integer> getStatusCounts() { return statusCounts; }
    public void setStatusCounts(Map<String, Integer> statusCounts) { this.statusCounts = statusCounts; }
    
    @Data
    public static class ExpenseSummaryDTO {
        private Long id;
        private double amount;
        private String category;
        private String description;
        private String date;
        private String status;
        private String priority;
        
        // Getters and Setters for ExpenseSummaryDTO
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        
        public double getAmount() { return amount; }
        public void setAmount(double amount) { this.amount = amount; }
        
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getDate() { return date; }
        public void setDate(String date) { this.date = date; }
        
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
    }
} 