-- Set all users to have the ROLE_EMPLOYEE as their role by default
UPDATE users
SET role_id = (SELECT id FROM roles WHERE name = 'ROLE_EMPLOYEE'); 