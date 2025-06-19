package com.expense.management.model;

import java.time.LocalDate;

import org.hibernate.annotations.CreationTimestamp;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.format.annotation.DateTimeFormat;

import com.expense.management.enums.ApprovalLevel;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "expenses")
public class Expense {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

//	@Column(nullable = false)
	private double amount;

//	@Column(nullable = false)
	private String category;

	private String description;


//	@CreationTimestamp
	private LocalDate date;

	@Enumerated(EnumType.STRING)
	@Column(name = "approval_status")
	private ExpenseStatus approvalStatus = ExpenseStatus.PENDING;
	
	@Enumerated(EnumType.STRING)
	@Column(name= "approval_level")
	private ApprovalLevel approvalLevel = ApprovalLevel.MANAGER;
	
	
	@Column(name= "priority")
	private String priority;
	
	@Column(name= "comments")
	private String comments;
	
	@Lob
	private byte[] attachment;

	@Column(name = "attachment_type")
	private String attachmentType;

	@Column(name = "receipt_url")
	private String receiptUrl;

	@ManyToOne
	@JoinColumn(name = "user_id")
	@JsonIgnore
	User user;
	
	
}
