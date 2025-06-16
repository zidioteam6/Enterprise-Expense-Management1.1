-- Delete existing roles to avoid duplicates
DELETE FROM roles;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('ROLE_EMPLOYEE', 'Regular employee who can submit expenses'),
('ROLE_MANAGER', 'Manager who can approve expenses'),
('ROLE_ADMIN', 'Administrator with full system access'); 