# AcadSync AI 🎓

An AI-powered academic management and campus notification platform.

---

## 🚀 Features
- Event approval workflow
- Smart automated notifications
- Centralized academic coordination
- Role-based access (Admin / Student)

---

## 🛠 Tech Stack

### Backend
- Python
- Flask
- Flask-CORS
- SQLite (or your preferred DB)

### Frontend
- React 19 + Vite
- React Router v7
- Component-based architecture
- Responsive CSS

---

## 📁 Project Structure

```
AcadSync/
├── backend/
│   └── app.py               # Flask API server
└── frontend/
    ├── public/
    ├── src/
    │   ├── components/       # Reusable UI components
    │   │   ├── Navbar.jsx
    │   │   ├── EventCard.jsx
    │   │   ├── NotificationItem.jsx
    │   │   └── Modal.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx  # Global auth state
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── EventsPage.jsx
    │   │   └── NotificationsPage.jsx
    │   ├── services/
    │   │   └── api.js        # API service layer
    │   └── App.jsx           # Router + layout
    ├── .env.example
    └── package.json
```

---

## ⚙ Installation

### Backend

```bash
git clone https://github.com/yourusername/AcadSync.git
cd AcadSync
pip install -r requirements.txt
python backend/app.py
```

### Frontend

```bash
cd frontend
cp .env.example .env       # Configure API URL if needed
npm install
npm run dev                # http://localhost:5173
```

### Build for Production

```bash
cd frontend
npm run build
npm run preview
```

---

## 🌐 Pages & Routes

| Route            | Page                  | Access        |
|------------------|-----------------------|---------------|
| `/`              | Landing Page          | Public        |
| `/login`         | Login                 | Public        |
| `/register`      | Register              | Public        |
| `/dashboard`     | Student Dashboard     | Student only  |
| `/admin`         | Admin Dashboard       | Admin only    |
| `/events`        | Events Management     | Logged in     |
| `/notifications` | Notifications         | Logged in     |

---

## 🎓 Role-Based Access

- **Student**: View own events, request new events, receive notifications
- **Admin**: Approve/reject event requests, view all events and stats
