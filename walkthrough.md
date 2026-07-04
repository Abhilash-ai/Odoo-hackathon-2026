# Walkthrough: Human Resource Management System (HRMS)

This document summarizes the complete implementation details, codebase changes, security models, and verification tests performed on the newly built HRMS platform.

---

## What was Built

We built a full-stack, production-ready HRMS platform from scratch. Here is a summary of the features and architectures implemented:

### 1. Backend Service Layer (`backend/`)
- **Express Server (`src/index.ts`):** Implements server configuration, helmet (security headers), CORS (cross-origin validation), general request rate limits (500 per 15 min), and specialized auth route rate limits (100 per 15 min).
- **Prisma Schema (`prisma/schema.prisma`):** Declares models for:
  - `User` (general profile, contact information, emergency data, and salary configs)
  - `Attendance` (daily check-in/out records, working hours, and presence indicators)
  - `LeaveRequest` (leave categories, duration dates, reasoning, attachments, and approvals)
  - `LeaveBalance` (paid, sick, casual, unpaid balances)
  - `Payroll` (monthly statements, base, allowances, deductions, net)
  - `Notification` (transactional user alerts)
  - `Announcement` (notices posted by HR)
- **Role-Based Guards (`src/middleware/auth.middleware.ts`):** Authenticates sessions via JWT and enforces roleguards (`ADMIN` vs `EMPLOYEE`) for administrative routes.
- **Transactional Logic:**
  - *Leave Deductions:* Approving a leave request automatically deducts days from the employee's `LeaveBalance` and inserts `LEAVE` records into their `Attendance` log for the requested range.
  - *Attendance Logic:* Clocking in after 9:15 AM marks status as `LATE`. Clocking out early with under 4 hours of duty marks status as `HALF_DAY`.
  - *Seeder (`prisma/seed.ts`):* Populates default users (Admin + 2 Employees) and historical clock logs so dashboard charts load with rich operational data.

### 2. Frontend Application Layer (`frontend/`)
- **Routing Engine (`src/App.tsx`):** Declares public (login, signup, password resets, verification) and protected routes.
- **Provider Wrapper Contexts:**
  - `AuthContext`: Persists sessions, handles token expiry, and syncs user info.
  - `ThemeContext`: Toggles between light and dark modes with localStorage persistence.
  - `ToastContext`: Slides animated success/error alert toast notifications.
- **Dashboard Widget Grid (`src/pages/Dashboard.tsx`):** Dynamic views. Admin view shows total presence stats, pending actions, and Recharts charts (attendance trends, category splits). Employee view displays check-in shortcuts, entitlements, and news feeds.
- **Calendar & History Logs (`src/pages/Attendance.tsx`):** Displays daily presence status in a custom-built month grid highlighting checks.
- **Payslip Invoices (`src/pages/Payroll.tsx`):** Earnings breakdown view styled as printable invoices for instant receipt downloads.
- **Admin Directory (`src/pages/admin/EmployeeManagement.tsx`):** Interactive directories allowing creations, suspends, deletes, updates, and CSV outputs.
- **Auditing CSV Exporter (`src/pages/admin/Reports.tsx`):** Client-side exporter extracting custom sheets (logs, payrolls, directories).

---

## Verification Results

### 1. Database Seeding & Integration
- Database was created locally (`dev.db`).
- Seeder ran successfully, creating administrative profiles, employee accounts, notices, and historical week-long check-in logs.

### 2. Backend Build Verification
- Running `npm run build` inside `backend/` completes successfully:
  ```text
  > backend@1.0.0 build
  > tsc
  ```
  No compiler or linting errors are present.

### 3. Frontend Build Verification
- Vite v5 and Tailwind CSS v3 were installed to match Node.js v20.14.0 requirements, avoiding native binding issues.
- Running `npm run build` inside `frontend/` compiles successfully.

---

## How to Run locally

Refer to [README.md](file:///c:/Users/HP/Desktop/ODOO%20hackathon%202026/README.md) for full parameters. In short:
1. Start backend:
   ```bash
   cd backend
   npm run dev
   ```
2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open browser to `http://localhost:5173`.
