-- Insert default admin user if not exists
INSERT INTO users (email, password, full_name, role_id)
SELECT 'admin123@gmail.com',
       '$2a$10$1IokK2uNRGCUnxaS3l6KEO3zadAnPFXhehB4WPWJG7mpihIPEDPm2',
       'Admin User',
       id
FROM roles
WHERE name = 'ROLE_ADMIN'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin123@gmail.com'
  );