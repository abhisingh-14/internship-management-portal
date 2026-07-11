# Internship Management Portal

A production-quality full-stack web application where students can find and
apply for internships, companies can post internships and manage applicants,
and administrators can manage the platform.

## Tech Stack

**Frontend:** React 19, Vite, Bootstrap 5, React Router DOM, Axios
**Backend:** Node.js, Express.js
**Database:** MySQL
**Authentication:** JWT, bcrypt
**File Upload:** Multer
**Validation:** Express Validator

## Monorepo Structure

This repository contains two independently deployable applications:

- `client/` — React single-page application (Vite)
- `server/` — Express REST API

See `docs/04_Project_Architecture.md` for the full architecture reference
and `docs/05_Coding_Standards.md` for binding coding conventions.

## Prerequisites

- Node.js (LTS version, 18.x or higher)
- npm
- MySQL 8.x

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd internship-management-portal

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Configure environment variables

Copy the example environment files and fill in real values. **Never commit
`.env` files.**

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

### 3. Run the backend

```bash
cd server
npm run dev
```

The API will start on the port defined in `server/.env` (default `5000`).

### 4. Run the frontend

```bash
cd client
npm run dev
```

The client will start on Vite's default dev server (default `5173`).

## Project Documentation

Full requirements, database design, API design, architecture, and coding
standards live in `docs/`:

- `00_Project_Overview.md`
- `01_Software_Requirements_Specification.md`
- `02_Database_Design.md`
- `03_API_Design.md`
- `04_Project_Architecture.md`
- `05_Coding_Standards.md`

## Status

Project scaffolding only. Authentication, database schema, business logic,
and API endpoints are implemented in subsequent development phases.