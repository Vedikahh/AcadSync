<div align="center">
  <img src="./frontend/public/vite.svg" alt="AcadSync Logo" width="80" />
  <h1>AcadSync</h1>
  <p><strong>A Next-Generation Academic Management & Intelligent Scheduling Platform</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

## 🚀 Overview

**AcadSync** is a premium, AI-powered campus management ecosystem designed to streamline university operations. It bridges the communication gap between Students, Faculty, and Administrators by offering intelligent scheduling, automated conflict resolution, and real-time event management in a beautiful, highly responsive interface.

---

## ✨ Key Features

- **Intelligent Conflict Detection:** AcadSync automatically scans event proposals against the master academic calendar to flag overlapping schedules, venue clashes, and resource constraints.
- **Role-Based Smart Dashboards:**
  - **Student Portal:** Track event proposals, view upcoming classes, and receive actionable system notifications.
  - **Faculty Portal:** Manage lecture schedules, review department metrics, and view real-time daily timelines.
  - **Admin Command Center:** Review institutional analytics, approve/reject event requests, and monitor system-wide conflict reports via advanced data grids.
- **Unified Academic Calendar:** A master, color-coded view mapping out lectures (blue), labs (green), exams (red), and campus events (purple).
- **Automated Workflow Notifications:** Real-time, clickable routing alerts keeping all users synchronized on approvals, rejections, and schedule changes.

---

## 🛠 Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Routing:** React Router v7
- **Styling:** Custom CSS architecture (BEM/Namespaced) with CSS Variables for premium light styling.
- **State Management:** React Context API (`AuthContext`)

### Backend (API)
- **Runtime:** Python 3.10+
- **Framework:** Flask
- **Data:** SQLite (Customizable to PostgreSQL/MySQL)

---

## 📁 System Architecture

```text
AcadSync/
├── backend/                  # Python Flask API
│   ├── app.py                # Main application entry point
│   ├── routes/               # API endpoint controllers
│   └── models/               # Database schemas
│
└── frontend/                 # React SPA
    ├── public/               # Static assets
    └── src/
        ├── components/       # Reusable, atomic UI building blocks (Sidebar, Navbar, Cards)
        ├── context/          # Global state (Auth, Theme)
        ├── pages/            # View components (Dashboards, Calendar, Login)
        ├── services/         # Axios API interceptors and fetching logic
        ├── App.jsx           # Root layout and Router configuration
        └── index.css         # Global design tokens and resets
```

---

## ⚙️ Getting Started

Follow these instructions to get a copy of AcadSync running on your local machine for development and testing.

### 1. Clone the Repository
```bash
git clone https://github.com/Vedikahh/AcadSync.git
cd AcadSync
```

### 2. Backend Setup
We recommend using a virtual environment for the Python backend.

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (Windows)
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask development server (Default: http://localhost:5000)
python app.py
```

### 3. Frontend Setup
Open a new terminal window and navigate to the frontend directory.

```bash
# Navigate to frontend directory
cd frontend

# Install Node.js dependencies
npm install

# Start the Vite development server (Default: http://localhost:5173)
npm run dev
```

---

## 🌐 Application Routing

| Route | View | Access Level | Description |
|-----------|-----------|-----------|-----------|
| `/` | Landing Page | Public | Marketing & Entry |
| `/login` | Authentication | Public | JWT Login Portal |
| `/dashboard` | Student Dashboard | Student | Personal event & alert overview |
| `/faculty-dashboard`| Faculty Dashboard | Faculty | Lecture timeline & dept stats |
| `/admin` | Admin Dashboard | Admin | Master command center |
| `/conflict` | Conflict Resolver | Admin/Student | AI-assisted clash resolution |
| `/calendar` | Unified Calendar | All Users | Master schedule visualization |
| `/profile` | User Settings | All Users | Security & Identity management |

---

## 🛡 Security & Access Control

AcadSync implements a robust Role-Based Access Control (RBAC) system. The `AuthContext` provides the application with the current user's role (`admin`, `faculty`, `student`), dynamically protecting routes using the `<ProtectedRoute>` wrapper and actively filtering Sidebar navigation to ensure users only access authorized systems.

---

<div align="center">
  <p>Built with ❤️ for modern academic institutions.</p>
</div>
