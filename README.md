<div align="center">
  <img src="./frontend/public/vite.svg" alt="AcadSync Logo" width="80" />
  <h1>AcadSync</h1>
  <p><strong>A Next-Generation Academic Management & Intelligent Scheduling Platform</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#security">Security</a>
  </p>
</div>

---

## 🚀 Overview

**AcadSync** is a premium, AI-powered campus management ecosystem designed to eliminate scheduling friction in modern universities. By bridging the gap between Students, Event Organizers, and Administrators, AcadSync offers **intelligent conflict detection**, automated workflow approvals, and a unified master calendar—all packaged within a high-performance, responsive React interface.

---

## ✨ Key Features

### 🧠 Intelligent Conflict Detection
- **Multi-Source Validation:** Automatically scans new event proposals against existing **approved events** AND the **master academic timetable** (lectures/labs).
- **AI-Driven Suggestions:** When a clash is detected, the system suggests alternative available slots based on venue availability and campus hours.

### 📅 Unified Event Lifecycle
- **End-to-End Workflow:** A streamlined multi-step wizard for creating, editing, and tracking event proposals.
- **Conflict Resolution Center:** A dedicated dashboard for Administrators to resolve complex overlaps and manage institutional resources effectively.

### 🔐 Multi-Role Ecosystem
- **Student Portal:** Real-time visibility into campus events, academic schedules, and personalized system notifications.
- **Organizer Portal:** Specialized tools for creating event requests, managing clashes, and monitoring approval pipelines.
- **Admin Command Center:** High-level institutional analytics, department-wise activity tracking, and master control over the academic calendar.

### 🔔 Real-Time Synchronization
- **Actionable Notifications:** Clickable alerts that route users directly to the relevant approval queue or event details.
- **Master Unified Calendar:** A color-coded, interactive visualization of the entire campus schedule.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Authentication:** Google OAuth 2.0 (GSI) & Managed JWT Sessions
- **Styling:** Premium Custom CSS with CSS Variables for state-of-the-art aesthetics.

### Backend (API)
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Security:** Argon2/Bcrypt Password Hashing & JWT-based RBAC.

---

## 📁 System Architecture

```text
AcadSync/
├── backend/                  # RESTful API Service
│   ├── config/               # Database (MongoDB) & JWT configurations
│   ├── controllers/          # Business logic (Auth, Events, Schedules, Notifications)
│   ├── middleware/           # RBAC guards & Token verification
│   ├── models/               # Data Schemas (User, Event, Schedule, Notification)
│   ├── routes/               # Modular API endpoint definitions
│   └── utils/                # Core engines (Conflict Detection, Time Parsers)
│
└── frontend/                 # Interactive SPA
    ├── src/
    │   ├── components/       # Atomic UI (Sidebar, EventCard, StatsCard, ConflictCard)
    │   ├── context/          # State engines (AuthContext, Theme)
    │   ├── pages/            # View Layers (Dashboards, Calendar, Resolution Center)
    │   ├── services/         # API Interceptors & Fetching logic
    │   ├── App.jsx           # Routing & Global Layout
    │   └── index.css         # Design Tokens & UI Global Resets
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- Google Cloud Console project (for Google Auth)

### 2. Backend Installation
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signing_key
GOOGLE_CLIENT_ID=your_google_client_id
CLIENT_URL=http://localhost:5173
# Optional for multi-origin setups
# ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
# Optional for backend AI features only
# GEMINI_API_KEY=your_gemini_api_key
# Optional for email notifications (see Email Setup below)
# MAIL_PROVIDER=smtp
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password
# SMTP_FROM=noreply@acadync.com
```
Notes:
- `MONGO_URI`, `JWT_SECRET`, and `GOOGLE_CLIENT_ID` are required at backend startup.
- In production, you should configure at least one allowed origin using `CLIENT_URL`, `FRONTEND_URL`, `CORS_ORIGIN`, or `ALLOWED_ORIGINS`. If omitted, the API now boots with a startup warning and temporarily allows all origins until configured.
- Keep all secrets in `backend/.env` only. Never put server secrets in frontend env files.
- Email configuration is *optional*. If not configured, the system will gracefully skip email delivery with clear logs.

#### Email Configuration Guide
Email delivery is **optional** and integrates seamlessly with the notification system. Users can toggle email preferences in their profile.

**Option 1: SMTP (Gmail, Outlook, etc.)**
```env
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=noreply@acadync.com
```
**For Gmail:** Generate an [App Password](https://support.google.com/accounts/answer/185833) (16 characters) instead of your account password.

**Option 2: SendGrid**
```env
MAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@acadync.com
```

**Option 3: Test/Development Mode** (logs emails to console)
```env
MAIL_PROVIDER=test
```

**Email Features:**
- ✅ Automatic reminders 24 hours before approved events
- ✅ Notifications for event approvals, rejections, and requests
- ✅ User controls in Profile → Email Notifications section
- ✅ Safe fallback behavior (no crash if email config is missing)
- ✅ Clear logs for debugging email delivery

Start the server:
```bash
npm start
```

### 3. Frontend Installation
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```
Frontend env notes:
- Only `VITE_` variables should exist in frontend env files.
- Do not add backend secrets such as `JWT_SECRET`, `MONGO_URI`, or `GEMINI_API_KEY`.

Launch the development server:
```bash
npm run dev
```

---

## 🌐 Application Routing

| Route | View | Access Level | Description |
|-----------|-----------|-----------|-----------|
| `/` | Landing Page | Public | Platform Introduction |
| `/login` | Authentication | Public | JWT & Google Login Portal |
| `/register` | Signup | Public | New User Registration |
| `/dashboard` | Portal | Student | Personal Event & Alert Hub |
| `/organizer-dashboard`| Portal | Organizer | Event Lifecycle Management |
| `/admin` | Portal | Admin | Institutional Analytics & Control |
| `/events` | Campus Wall | Authenticated | Listing of all campus activities |
| `/create-event` | Request Wizard | Org/Admin | Unified creation/edit pipeline |
| `/conflict` | Resolution Center | Org/Admin | AI-assisted clash resolver |
| `/calendar` | Master Calendar | Authenticated | Unified schedule visualization |
| `/manage-events` | Admin Queue | Admin | Review & Process Requests |
| `/schedule` | Master Schedule | Admin/Org | Timetable & Venue management |
| `/notifications` | Inbox | Authenticated | Real-time system-wide alerts |
| `/profile` | User Settings | Authenticated | Account & Identity Management |

---

## 🔒 Security Setup Checklist

1. Copy `backend/.env.example` to `backend/.env` and provide real backend values.
2. Copy `frontend/.env.example` to `frontend/.env` and provide public `VITE_` values only.
3. Ensure `backend/.env` is not tracked by git (it is ignored by default in this repository).
4. Rotate any key that has ever been committed to git history.
5. Keep CORS allowlists explicit in production with `CLIENT_URL`/`FRONTEND_URL`/`CORS_ORIGIN` and/or `ALLOWED_ORIGINS`.

---

<div align="center">
  <p>Built with ❤️ for modern academic institutions.</p>
</div>
