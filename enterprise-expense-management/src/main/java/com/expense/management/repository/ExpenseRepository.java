package com.expense.management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.expense.management.model.Expense;
import com.expense.management.model.ExpenseStatus;
import com.expense.management.model.User;
import com.expense.management.enums.ApprovalLevel;

import java.util.List;
import java.util.Optional;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE Expense e SET e.amount = :amount, e.category = :category, e.description = :description, e.date = :date, e.comments = :comments, e.priority = :priority WHERE e.id = :id")
    int updateExpenseById(
        @Param("id") Long id,
        @Param("amount") double amount,
        @Param("category") String category,
        @Param("description") String description,
        @Param("date") java.time.LocalDate date,
        @Param("comments") String comments,
        @Param("priority") String priority
    );

    List<Expense> findByUser(User user);
    
    // Methods for 3-level approval workflow
    List<Expense> findByApprovalLevelAndApprovalStatus(ApprovalLevel approvalLevel, ExpenseStatus approvalStatus);
    
    List<Expense> findByApprovalStatus(ExpenseStatus approvalStatus);

    // Find all expenses processed by a specific manager
    List<Expense> findByApprovedByManagerId(Long managerId);

    // Custom query to fetch expense with user relationship eagerly loaded
    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.user WHERE e.id = :id")
    Optional<Expense> findByIdWithUser(@Param("id") Long id);

}
