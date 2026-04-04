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

**AcadSync** is a premium campus management ecosystem designed to eliminate scheduling friction in modern universities. By bridging the gap between Students, Event Organizers, and Administrators, AcadSync offers **intelligent conflict detection**, automated workflow approvals, and a unified master calendar—all packaged within a high-performance, responsive React interface.

---

## ✨ Key Features

### 🧠 Intelligent Conflict Detection
- **Multi-Source Validation:** Automatically scans new event proposals against existing **approved events** AND the **master academic timetable** (lectures/labs).
- **Rule-Based Suggestions:** When a clash is detected, the system suggests alternative available slots based on schedule overlap and campus hours.
- **Optional AI Assist:** AI-enhanced conflict assistance powered by Google Gemini can be enabled via backend configuration.

### 📅 Unified Event Lifecycle
- **End-to-End Workflow:** A streamlined multi-step wizard for creating, editing, and tracking event proposals.
- **Conflict Resolution Center:** A dedicated dashboard for Administrators to resolve complex overlaps and manage institutional resources effectively.
- **Event Modals:** Instant access to event details via interactive modal views across all dashboards.

### 🌓 Seamless Dark Mode
- **Adaptive UI:** Fully integrated dark mode support that syncs with system preferences or user choice.
- **Dynamic Theming:** Powered by Tailwind CSS v4 for a premium, consistent visual experience across all modes.

### 🔄 Real-Time Synchronization
- **WebSocket Integration:** Powered by Socket.IO for instant calendar updates, notifications, and event status changes across all connected clients.
- **Instant Alerts:** Clickable real-time notifications that route users directly to relevant approval queues or event details.

### 📊 Administrative Tools
- **Bulk Schedule Import:** Seamlessly upload campus-wide timetables via CSV with comprehensive validation.
- **Import Versioning & Rollback:** Track import history and revert to previous schedule states with a single click, ensuring data integrity.
- **Audit Logging:** Detailed tracking of administrative actions for transparency and security.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite 7
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 Engine + PostCSS (High-performance, dynamic design system)
- **Icons:** Lucide React (Universal icon set)
- **Real-time:** Socket.IO-Client
- **Authentication:** Google OAuth 2.0 (GSI) & Managed JWT Sessions

### Backend (API)
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Real-time:** Socket.IO (WebSockets)
- **Database:** MongoDB Atlas (Mongoose 9+)
- **AI Integration:** Google Generative AI (Gemini Flash)
- **Security:** Argon2/Bcrypt Password Hashing & JWT-based RBAC.

---

## 📁 System Architecture

```text
AcadSync/
├── backend/                  # RESTful API Service & WebSocket Server
│   ├── config/               # Database (MongoDB) & JWT configurations
│   ├── controllers/          # Business logic (Auth, Events, Schedules, Notifications)
│   ├── middleware/           # RBAC guards & Token verification
│   ├── models/               # Data Schemas (User, Event, Schedule, Notification, Audit)
│   ├── routes/               # Modular API endpoint definitions
│   ├── utils/                # Core engines (Conflict Detection, Socket handler, Audit)
│   └── validators/           # Payload validation (Joi/Zod)
│
└── frontend/                 # Interactive SPA
    ├── src/
    │   ├── components/       # Atomic UI (Sidebar, EventCard, StatsCard, ConflictCard)
    │   ├── context/          # State engines (AuthContext, ThemeContext)
    │   ├── pages/            # View Layers (Dashboards, Calendar, Resolution Center)
    │   ├── services/         # API Interceptors & Socket.IO initialization
    │   ├── App.jsx           # Routing & Global Layout
    │   └── index.css         # Tailwind v4 Design Tokens & Global Styles
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
# Optional for backend AI assist
GEMINI_API_KEY=your_gemini_api_key
# Optional for email notifications
MAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

Start the development server (with watch mode):
```bash
npm run dev
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

Launch the development server:
```bash
npm run dev
```

---

## 🌐 Application Routing

| Route | View | Access Level | Description |
|-----------|-----------|-----------|-----------|
| `/` | Landing Page | Public | Modern Intro with Particle Animations |
| `/login` | Authentication | Public | JWT & Google Login Portal |
| `/register` | Signup | Public | New User Registration |
| `/dashboard` | Student Portal | Student | Personal Event & Alert Hub |
| `/organizer-dashboard`| Planner Portal | Organizer | Event Lifecycle Management |
| `/admin` | Admin Command | Admin | Institutional Analytics & Control |
| `/events` | Campus Wall | Authenticated | Listing of all campus activities |
| `/create-event` | Request Wizard | Org/Admin | Unified creation/edit pipeline |
| `/conflict` | Resolution Center | Org/Admin | Clash resolver with suggestions |
| `/calendar` | Master Calendar | Authenticated | Real-time schedule visualization |
| `/manage-events` | Admin Queue | Admin | Review & Process Requests |
| `/schedule` | Master Schedule | Admin/Org | Bulk Import (CSV) & Venue management |
| `/profile` | User Settings | Authenticated | Account & Dark Mode preferences |

---

## 🔒 Security Setup Checklist

1. Copy `backend/.env.example` to `backend/.env` and provide real backend values.
2. Ensure `backend/.env` is not tracked by git.
3. Keep CORS allowlists explicit in production with `CLIENT_URL`.
4. Rotate `JWT_SECRET` periodically for enhanced security.

---

<div align="center">
  <p>Built with ❤️ for modern academic institutions.</p>
</div>
