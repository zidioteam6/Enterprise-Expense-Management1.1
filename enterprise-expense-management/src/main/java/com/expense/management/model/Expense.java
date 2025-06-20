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

	@Column(name = "approved_by_manager_id")
	private Long approvedByManagerId;

	// // Getters and Setters for all fields
	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	
	public double getAmount() { return amount; }
	public void setAmount(double amount) { this.amount = amount; }
	
	public String getCategory() { return category; }
	public void setCategory(String category) { this.category = category; }
	
	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }
	
	public LocalDate getDate() { return date; }
	public void setDate(LocalDate date) { this.date = date; }
	
	public ExpenseStatus getApprovalStatus() { return approvalStatus; }
	public void setApprovalStatus(ExpenseStatus approvalStatus) { this.approvalStatus = approvalStatus; }
	
	public ApprovalLevel getApprovalLevel() { return approvalLevel; }
	public void setApprovalLevel(ApprovalLevel approvalLevel) { this.approvalLevel = approvalLevel; }
	
	public String getPriority() { return priority; }
	public void setPriority(String priority) { this.priority = priority; }
	
	public String getComments() { return comments; }
	public void setComments(String comments) { this.comments = comments; }
	
	public byte[] getAttachment() { return attachment; }
	public void setAttachment(byte[] attachment) { this.attachment = attachment; }
	
	public String getAttachmentType() { return attachmentType; }
	public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }
	
	public User getUser() { return user; }
	public void setUser(User user) { this.user = user; }

    public String getReceiptUrl() {
        return receiptUrl;
    }

    public void setReceiptUrl(String receiptUrl) {
        this.receiptUrl = receiptUrl;
    }
	
	public Long getApprovedByManagerId() { return approvedByManagerId; }
	public void setApprovedByManagerId(Long approvedByManagerId) { this.approvedByManagerId = approvedByManagerId; }
	
}
