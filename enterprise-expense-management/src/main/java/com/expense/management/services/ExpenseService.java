package com.expense.management.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.expense.management.enums.ApprovalLevel;
import com.expense.management.model.Expense;
import com.expense.management.model.ExpenseStatus;
import com.expense.management.repository.ExpenseRepository;

@Service
public class ExpenseService {
	ExpenseRepository expenseRepository;

	ExpenseService(ExpenseRepository expenseRepository) {
		this.expenseRepository = expenseRepository;
	}

	public List<Expense> getAll() {
		return expenseRepository.findAll();
	}

	public Expense add(Expense expense) {
		if (expense.getAmount() < 3000) {
			expense.setPriority("Low");
			expense.setApprovalLevel(ApprovalLevel.MANAGER);
		} else if (expense.getAmount() < 20000) {
			expense.setPriority("Medium");
			expense.setApprovalLevel(ApprovalLevel.FINANCE);
		} else {
			expense.setPriority("High");
			expense.setApprovalLevel(ApprovalLevel.ADMIN);
		}
		return expenseRepository.save(expense);
	}

	public boolean approve(long id) {
		Expense expense = expenseRepository.findById(id).orElseThrow(() -> new RuntimeException("expense not found!"));
		if (expense.getApprovalLevel() == ApprovalLevel.MANAGER) {
			expense.setApprovalLevel(ApprovalLevel.FINANCE);
			expenseRepository.save(expense);
			return true;
		} else if (expense.getApprovalLevel() == ApprovalLevel.FINANCE) {
			expense.setApprovalLevel(ApprovalLevel.ADMIN);
			expenseRepository.save(expense);
			return true;
		} else if (expense.getApprovalLevel() == ApprovalLevel.ADMIN) {
			expense.setApprovalStatus(ExpenseStatus.APPROVED);
			expenseRepository.save(expense);
			return true;
		}
		return false;
	}

	/**
	 * Reject expense - sets status to REJECTED
	 */
	public boolean reject(long id) {
		Expense expense = expenseRepository.findById(id).orElseThrow(() -> new RuntimeException("expense not found!"));
		expense.setApprovalStatus(ExpenseStatus.REJECTED);
		expenseRepository.save(expense);
		return true;
	}

	/**
	 * Get expenses pending manager approval
	 */
	public List<Expense> getExpensesPendingManagerApproval() {
		return expenseRepository.findByApprovalLevelAndApprovalStatus(ApprovalLevel.MANAGER, ExpenseStatus.PENDING);
	}

	/**
	 * Get expenses pending finance approval (approved by manager)
	 */
	public List<Expense> getExpensesPendingFinanceApproval() {
		return expenseRepository.findByApprovalLevelAndApprovalStatus(ApprovalLevel.FINANCE, ExpenseStatus.PENDING);
	}

	/**
	 * Get expenses pending admin approval (approved by finance)
	 */
	public List<Expense> getExpensesPendingAdminApproval() {
		return expenseRepository.findByApprovalLevelAndApprovalStatus(ApprovalLevel.ADMIN, ExpenseStatus.PENDING);
	}

	/**
	 * Get fully approved expenses (for employee dashboard)
	 */
	public List<Expense> getFullyApprovedExpenses() {
		return expenseRepository.findByApprovalStatus(ExpenseStatus.APPROVED);
	}

	/**
	 * Get all expenses for a specific user
	 */
	public List<Expense> getAllByUser(com.expense.management.model.User user) {
		return expenseRepository.findByUser(user);
	}
}
