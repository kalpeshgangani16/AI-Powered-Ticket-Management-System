# AI-Powered Ticket Management System

An enterprise-grade Helpdesk and Support Ticket Management System featuring automated AI ticket triaging, dynamic workload-balanced routing, secure authentication, role-based authorization, and a modern glassmorphic dashboard interface.

---

## 🚀 Key Features

* 🤖 **AI Ticket Triaging**: Automatically analyzes ticket descriptions using **Gemini 2.0 Flash** to identify the correct technical department, detect the root cause, and generate multi-step troubleshooting guidelines.
* ⚖️ **Workload-Balanced Engineer Assignment**: Automatically assigns new tickets to the Support Engineer with the lowest workload in that department (Weighted system: `OPEN = 1.0`, `IN_PROGRESS = 2.0`). Resolves ties deterministically using engineer seniority.
* 🔒 **Role-Based Access Control (RBAC)**:
  * **Admin**: Complete system control, user directory creation, account deletion, and manual ticket reassignments.
  * **Support Engineer**: Restricted workspace containing only tickets assigned to or created by them, with full diagnostic analytics.
  * **Employee**: Standard portal for ticket submission, comment conversations, and attachment tracking.
* 🧹 **Cascade-Safe Deletion**: Advanced cleanup service allowing Admins to delete accounts. Automatically nullifies assigned work while cascading deletions cleanly to comments, attachments, and authored tickets.
* 🔌 **Environment Externalization**: Built-in programmatic `.env` property loader to ensure zero hardcoded passwords or API keys are committed to Git.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Java 21/22, Spring Boot 3.3.0, Spring Security (JWT), Spring Data JPA (Hibernate), Lombok, Maven |
| **Frontend** | React 18, Vite, Vanilla CSS (Premium Glassmorphic UI), Bootstrap 5, Axios |
| **Database** | MySQL 8.x |
| **Containerization** | Docker, Docker Compose |

---

## 📂 Project Structure

```text
├── backend/                   # Spring Boot REST API
│   ├── src/main/java/...      # Controller, Service, Entity, Security & Repository layers
│   ├── src/main/resources/    # Application properties configuration template
│   └── pom.xml                # Maven Dependencies
├── frontend/                  # React Single Page Application (SPA)
│   ├── src/components/        # Shared UI components
│   ├── src/pages/             # Premium layout views (Dashboard, UserManagement, etc.)
│   ├── src/services/api.js    # Axios client and API mapping
│   └── package.json           # npm dependencies
├── docker-compose.yml         # Containerized MySQL database service
├── .env                       # Local environment secrets (IGNORED BY GIT)
└── .gitignore                 # Root git rules
```

---

## ⚙️ Local Development Setup

### 1. Environment Configurations
Create a `.env` file in the **root directory** (parallel to `backend/` and `frontend/` directories) containing the following fields:

```env
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Token Secret Key
JWT_SECRET=your_custom_32_byte_secret_key_string_here

# Database Credentials
DB_USERNAME=your_mysql_username
DB_PASSWORD=your_mysql_password
```

### 2. Database Services
Ensure you have MySQL running locally on port `3306`, or spin up the included containerized instance using Docker:
```bash
docker-compose up -d
```

### 3. Backend Setup
1. Set your `JAVA_HOME` environment variable to target **JDK 21 or 22**.
2. Clean, compile, and run the boot application:
```powershell
# Windows PowerShell example
$env:JAVA_HOME="C:\Program Files\Java\jdk-22"
cd backend
mvn clean compile
mvn spring-boot:run
```
The REST API will boot up on `http://localhost:8080`.

### 4. Frontend Setup
1. Open a new terminal window.
2. Install npm packages and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend portal will launch on `http://localhost:5173`.

---

## 🔑 Default Roles & Logins

When initialized for the first time, use these default credentials to test user roles:
* **Admin**: `admin@desk.com` / `admin123`
* **Support Engineer**: `engineer@desk.com` / `engineer123`
* **Employee**: `employee@desk.com` / `employee123`
