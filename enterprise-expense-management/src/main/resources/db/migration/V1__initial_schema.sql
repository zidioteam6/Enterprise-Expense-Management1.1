-- Create roles table
CREATE TABLE roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Create users table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Create expense_categories table
CREATE TABLE expense_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expenses table
CREATE TABLE expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount FLOAT(53) NOT NULL,
    category VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE,
    approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    priority VARCHAR(20),
    attachment TINYBLOB,
    attachment_type VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create expense_approvals table
CREATE TABLE expense_approvals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id BIGINT NOT NULL,
    approver_id BIGINT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id),
    FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details VARCHAR(1000),
    status VARCHAR(255) NOT NULL
);

-- Create notifications table
CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create budget table
CREATE TABLE budget (
    category VARCHAR(191) PRIMARY KEY,
    budget_limit FLOAT(53) NOT NULL
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('ROLE_EMPLOYEE', 'Regular employee who can submit expenses'),
('ROLE_MANAGER', 'Manager who can approve expenses'),
('ROLE_ADMIN', 'Administrator with full system access'); 