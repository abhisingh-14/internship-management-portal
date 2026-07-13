# Internship Management Portal

A production-quality full-stack web application where students can find and apply for internships, companies can post internships and manage applicants, and administrators can oversee and moderate the ecosystem.

---

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, Bootstrap 5, React Router DOM, Axios
- **Backend:** Node.js, Express.js
- **Database:** MySQL 8.x (InnoDB Storage Engine)
- **Authentication:** Stateful Refresh + Stateless Access JWTs, password hashing with bcrypt
- **File Upload:** Multer (secure UUID disk storage)
- **Validation:** Express Validator

---

## 📁 Project Architecture & Monorepo Structure

The repository is organized as a decoupled monorepo:
*   `client/` — React single-page application (bundled via Vite)
*   `server/` — Express REST API and database model layer
*   `docs/` — System specification and architectural designs

### Layered Architecture Design
All operations follow a structured, multi-layer request pipeline:
```
Client (Axios) ➔ Router ➔ Authentication ➔ Role Authorization ➔ Validator ➔ Controller ➔ Model ➔ MySQL
```
This ensures complete isolation of business logic, database queries, and route configurations.

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (LTS version, >= 18.x)
- npm
- MySQL 8.x

### 2. Installation
Install all dependencies for both the frontend and backend using the root helper script:
```bash
# Clone the repository
git clone <repository-url>
cd internship-management-portal

# Install all workspace dependencies
npm run install-all
```

### 3. Database Configuration
1. Start your local MySQL service.
2. Create an empty database:
   ```sql
   CREATE DATABASE internship_portal;
   ```
3. Initialize the schema and views using the SQL scripts under `server/database/`:
   ```bash
   mysql -u <user> -p internship_portal < server/database/schema.sql
   mysql -u <user> -p internship_portal < server/database/views.sql
   ```
4. (Optional) Populate sample data for testing:
   ```bash
   mysql -u <user> -p internship_portal < server/database/seed.sql
   ```

### 4. Configuration (Environment Variables)
Create a `.env` file in both `client/` and `server/` directories based on their `.env.example` configurations.

**Server Environment Setup (`server/.env`):**
```ini
NODE_ENV=development # Change to 'production' for static file serving
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=internship_portal
DB_CONNECTION_LIMIT=10

JWT_SECRET=your_long_random_access_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_long_random_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10
MAX_RESUME_SIZE_MB=5
MAX_LOGO_SIZE_MB=2
```

**Client Environment Setup (`client/.env`):**
```ini
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 💻 Running the Application

### Development Mode (Concurrent Instances)
In development, the frontend and backend run as separate local dev servers:
```bash
# Run backend dev server (port 5000)
npm run dev:server

# Run client dev server (port 5173) in a separate terminal
npm run dev:client
```

### Production Build & Execution (Single Host Serving)
In production, the Express backend builds and serves the React client statically from the same port, removing the need for a separate frontend instance:
```bash
# 1. Compile the React SPA bundle
npm run build:client

# 2. Update server/.env
NODE_ENV=production

# 3. Start the production backend server
npm start
```
The application will be accessible at `http://localhost:5000`.

---

## 📑 Project Documentation

Full requirements, design documentation, and setup files are located in the `/docs` directory:
- [00_Project_Overview.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/00_Project_Overview.md)
- [01_Software_Requirements_Specification.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/01_Software_Requirements_Specification.md)
- [02_Database_Design.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/02_Database_Design.md)
- [03_API_Design.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/03_API_Design.md)
- [04_Project_Architecture.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/04_Project_Architecture.md)
- [05_Coding_Standards.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/05_Coding_Standards.md)
- [Project_Explanation.md](file:///d:/project-fsd/internship-management-portal-fixed/internship-management-portal/docs/Project_Explanation.md) — Comprehensive architecture & walkthrough guide.