package com.expense.management.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Data
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    // @Enumerated(EnumType.STRING)
    // @Column(nullable = false)
    // private Role role = Role.MANAGER; // ✅ Add this field

    @OneToMany(cascade = CascadeType.ALL, mappedBy = "user")
    @JsonIgnore
    List<Expense> expenses;

    // Constructors
    public User() {
    }

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Lob
    @Column(name = "profile_image")
    private byte[] profileImage;

    @Column(name = "profile_image_type")
    private String profileImageType;

    // // Getters and Setters for all fields
    // public Long getId() { return id; }
    // public void setId(Long id) { this.id = id; }

    // public String getEmail() { return email; }
    // public void setEmail(String email) { this.email = email; }

    // public String getPassword() { return password; }
    // public void setPassword(String password) { this.password = password; }

    // public List<Expense> getExpenses() { return expenses; }
    // public void setExpenses(List<Expense> expenses) { this.expenses = expenses; }

    // public String getFullName() { return fullName; }
    // public void setFullName(String fullName) { this.fullName = fullName; }

    // public Role getRole() { return role; }
    // public void setRole(Role role) { this.role = role; }

    // public LocalDateTime getCreatedAt() { return createdAt; }
    // public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // public LocalDateTime getUpdatedAt() { return updatedAt; }
    // public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // public byte[] getProfileImage() { return profileImage; }
    // public void setProfileImage(byte[] profileImage) { this.profileImage = profileImage; }

    // public String getProfileImageType() { return profileImageType; }
    // public void setProfileImageType(String profileImageType) { this.profileImageType = profileImageType; }

}
