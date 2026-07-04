#  HRMS - Modern Human Resource Management System

A production-ready, premium SaaS Human Resource Management System (HRMS) built from scratch. Inspired by leading platforms like Zoho People, BambooHR, and Odoo HR, this system features a sleek modern design, dark/light theme options, robust JWT-based authorization, precise attendance tracking, comprehensive leave management with automatic logs integration, and complete payroll generation utilities.

---

## Technical Stack

### Frontend
- **React + TypeScript** (scaffolded via Vite)
- **Tailwind CSS** (curated theme using dynamic HSL tokens)
- **React Router v6** (declarative client-side routing with roleguards)
- **React Query (TanStack)** (optimized server state cache management)
- **Framer Motion** (smooth micro-animations, fade-ins, and slides)
- **Lucide Icons** (clean corporate iconography)
- **Recharts** (premium analytics charts)

### Backend
- **Node.js + Express + TypeScript**
- **Prisma ORM** (database-agnostic, configured with SQLite locally and PostgreSQL ready for production)
- **JWT (JSON Web Token)** (secure auth sessions with 24-hour expiry)
- **Bcrypt** (blowfish-salted password hashing)
- **Express Rate Limit** (protection against auth brute forcing)
- **Helmet** (HTTP security headers injection)

---

## Folder Structure

```text
c:\Users\HP\Desktop\ODOO hackathon 2026/
├── backend/
│   ├── prisma/
│   │   ├── dev.db            # Local SQLite database file (generated after db push)
│   │   ├── schema.prisma     # Prisma database schema definitions
│   │   └── seed.ts           # Seeder script populating default users and stats
│   ├── src/
│   │   ├── controllers/      # REST API Route controllers
│   │   ├── middleware/       # JWT parsing, RBAC validation, rate limiting
│   │   ├── routes/           # Router groups (auth, employee, leaves, payroll)
│   │   ├── utils/            # DB client references, mail helpers, CSV escaping
│   │   └── index.ts          # Express entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/       # App Layout wrappers, protected auth guards
│   │   ├── context/          # Authentication state, HSL Themes, Custom Toast alerts
│   │   ├── pages/            # View pages (Dashboard, Attendance, Leaves, Payroll, Profile, Settings)
│   │   │   └── admin/        # Admin-restricted management pages
│   │   ├── services/         # API client mapping requests to backend
│   │   ├── index.css         # Global stylesheets, scrollbars, HSL root variables
│   │   ├── main.tsx          # React application root
│   │   └── App.tsx           # Router mappings and wrapper providers
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js** (v20.14.0 or higher)
- **npm** (v10.7.0 or higher)

### Setup & Installation

#### 1. Configure and Run Backend
1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Sync the database using Prisma (generates the client and SQLite file):
   ```bash
   npx prisma db push
   ```
4. Seed the database with default HR Admin and employee records:
   ```bash
   npm run seed
   ```
5. Start the backend developer server on port 5000:
   ```bash
   npm run dev
   ```

#### 2. Configure and Run Frontend
1. Open a separate terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite React development server on port 5173:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173` to interact with the system.

---

## Default Accounts (Seeded Data)

### 1. HR Admin Account
- **Email:** `admin@company.com` (or Employee ID: `EMP001`)
- **Password:** `password123`
- **Role:** `ADMIN`

### 2. Regular Employee Accounts
- **Employee 1:** `john@company.com` (or ID: `EMP002`) | Password: `password123`
- **Employee 2:** `jane@company.com` (or ID: `EMP003`) | Password: `password123`

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key-change-in-production-123456789"
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

---

## Key Features Implemented

1. **Authentication Flow:** Full sign-up, sign-in, forgot password recovery, and email verification (logged to console and local file `backend/logs/mail-logs.txt` for easy activation link retrieval).
2. **Attendance Clocking:** Live dashboard check-in/out widgets. Calculates active working hours. Categorizes check-ins into PRESENT, LATE (after 9:15 AM), or HALF_DAY (under 4 hours).
3. **Leave Tracker:** Interactive dashboard showing balance counters. Dynamic request forms. Automatic leave date injection into attendance histories upon HR approval.
4. **Payroll Generator:** Monthly billing process. Base salary configurations. Generates printable salary breakdown slips.
5. **Admin Console:** Company overview analytics (headcount, presence ratios, expense charts), full employee CRUD tables, suspension triggers, and client-side CSV downloads.

---

## Future Scope

- **Real-Time WebSockets:** Live message/notification relays instead of periodic polling.
- **Biometric Integration:** Connect clocking systems directly to corporate hardware keys.
- **Auto PDF Renderer:** Core server-side PDF compilers for downloadable statements (e.g., pdfkit).
- **OCR Document Processing:** Automatic parsing of uploaded credentials using AI model extractors.

---

## License

This project is licensed under the MIT License.
