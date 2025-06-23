# Enterprise Expense Management System

## 📝 Project Overview
The Enterprise Expense Management System is a robust, full-stack web application designed for organizations to track, manage, and analyze employee expenses efficiently. With secure, role-based access, the system streamlines the reimbursement process through multi-level approvals, audit logs, real-time analytics, and automated reporting. The platform provides dedicated dashboards for Employees, Managers, Finance Officers, and Administrators.

## 🔧 Key Technologies
- **Backend:** Java, Spring Boot, Spring Security (JWT, OAuth2), Spring Data JPA, Flyway, Lombok
- **Frontend:** React (Redux Toolkit, Material UI)
- **Database:** MySQL
- **Other:** Docker, AWS EC2/RDS, Vercel, Cloudinary, Chart.js, WebSockets

## 📚 Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
- [Default Admin Credentials](#default-admin-credentials)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Security Notes](#security-notes)
- [Contributing](#contributing)
- [Contact / Support](#contact--support)

## 🚀 Features

### 🔐 Authentication
- Sign up & Login with JWT
- OAuth2 login (Google, GitHub)

### 🧑‍💼 Role-Based Dashboards
- **Employee:** Submit/view expenses, track status
- **Manager:** Approve/reject expenses, view team submissions
- **Finance:** Approve/reject expenses, reimbursements, and financial reporting
- **Admin:** Final approvals, manage users, assign roles, and audit logs

### ✨ Additional Features
- Real-time notification system
- Upload receipts via Cloudinary
- Budget limits and auto-approval thresholds
- PDF/Excel reports with charts and analytics
- Audit trail for all critical actions

## 🛠 Getting Started

### ✅ Prerequisites
- Java 17+
- Node.js 18+
- MySQL
- Maven
- Docker (optional)

### 📦 Setup Instructions

#### Backend (Spring Boot)
```bash
git clone https://github.com/your-org/enterprise-expense-management.git
cd enterprise-expense-management
mvn clean install
mvn spring-boot:run
```

#### Frontend (React)
```bash
cd expense-management
npm install
npm start
```

#### Database Migration
Flyway is used for database versioning. Migrations run automatically on app start. A default admin user is created during the initial migration.

## 🔑 Default Admin Credentials
> ⚠️ Please change the default credentials immediately after first login!
- **Username:** admin123@gmail.com
- **Password:** 123456

## ⚙️ Configuration

### Database Configuration
Edit `src/main/resources/application.properties`:

```properties
spring.datasource.url=your database url
spring.datasource.username=your database username
spring.datasource.password=your database password
```

### ✉️ Mail (SMTP) Configuration

```properties
spring.mail.host=MAIL_HOST
spring.mail.port=587
spring.mail.username=MAIL_USERNAME
spring.mail.password=MAIL_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### ☁️ Cloudinary Configuration

```properties
cloudinary.cloud_name=CLOUDINARY_CLOUD_NAME
cloudinary.api_key=CLOUDINARY_API_KEY
cloudinary.api_secret=CLOUDINARY_API_SECRET
```

### 🔐 JWT & OAuth2 Configuration

```properties
app.jwt.secret=JWT_SECRET
app.jwt.expiration=JWT_EXPIRATION_MS
spring.security.oauth2.client.registration.google.client-id=GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=GOOGLE_CLIENT_SECRET
spring.security.oauth2.client.registration.github.client-id=GITHUB_CLIENT_ID
spring.security.oauth2.client.registration.github.client-secret=GITHUB_CLIENT_SECRET
```
```

---
## 👥 Usage
- Access each dashboard based on your assigned role.
- Admin users can promote others to Manager, Finance, or Admin via the Admin Dashboard.
- Role-based routing ensures proper access control throughout the app.

## 📁 Project Structure

### Backend (`/backend`)
- `controller/` - REST controllers
- `service/` - Business logic
- `repository/` - Spring Data JPA interfaces
- `model/` - Entity classes
- `config/` - JWT, OAuth2, Security configs

### Frontend (`/frontend`)
- `components/` - Reusable UI elements
- `pages/` - Views based on routes and roles
- `redux/` - Global state management
- `services/` - API service layer
- `utils/` - Helper functions

## 🔒 Security Notes
- Passwords are hashed using strong encryption (e.g., BCrypt).
- JWT tokens are securely managed for session control.
- OAuth2 logins handled with Spring Security integrations.
- Default admin credentials must be changed after deployment.

## 🤝 Contributing
We welcome contributions! To contribute:
- Fork the repo
- Create your feature branch (`git checkout -b feature/your-feature`)
- Commit your changes
- Push to the branch
- Open a Pull Request

## 📬 Contact / Support
- **Maintainer:** ZIDIO Development
- **Location:** Bengaluru, Karnataka
