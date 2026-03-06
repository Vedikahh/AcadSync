/* ========================================
   AcadSync AI - Main JavaScript
   ======================================== */

// ---------- Configuration ----------
const API_BASE = 'http://localhost:5000';

// ---------- State ----------
const state = {
  currentUser: null,
  role: null,
  events: [],
  notifications: []
};

// ---------- Sample Data ----------
const sampleEvents = [
  {
    id: 1,
    title: 'Annual Tech Symposium 2026',
    type: 'Academic',
    date: '2026-03-15',
    time: '10:00 AM',
    location: 'Main Auditorium',
    description: 'Explore the latest trends in AI, IoT, and cybersecurity with industry experts.',
    organizer: 'CS Department',
    status: 'approved',
    attendees: 250
  },
  {
    id: 2,
    title: 'Cultural Festival — Spring Edition',
    type: 'Cultural',
    date: '2026-03-22',
    time: '2:00 PM',
    location: 'Open Air Theatre',
    description: 'A vibrant celebration of music, dance, and art from across the campus.',
    organizer: 'Cultural Committee',
    status: 'approved',
    attendees: 500
  },
  {
    id: 3,
    title: 'Workshop: Machine Learning Basics',
    type: 'Workshop',
    date: '2026-04-01',
    time: '11:00 AM',
    location: 'Lab 204',
    description: 'Hands-on workshop for beginners covering ML fundamentals with Python.',
    organizer: 'AI Club',
    status: 'pending',
    attendees: 40
  },
  {
    id: 4,
    title: 'Inter-College Sports Meet',
    type: 'Sports',
    date: '2026-04-10',
    time: '8:00 AM',
    location: 'Sports Complex',
    description: 'Annual inter-college sports competition across multiple disciplines.',
    organizer: 'Sports Committee',
    status: 'approved',
    attendees: 600
  },
  {
    id: 5,
    title: 'Guest Lecture: Blockchain in Finance',
    type: 'Academic',
    date: '2026-04-05',
    time: '3:00 PM',
    location: 'Seminar Hall B',
    description: 'An expert talk on blockchain applications in the financial sector.',
    organizer: 'Finance Department',
    status: 'pending',
    attendees: 80
  },
  {
    id: 6,
    title: 'Hackathon: Code for Good',
    type: 'Workshop',
    date: '2026-04-20',
    time: '9:00 AM',
    location: 'Innovation Centre',
    description: '24-hour hackathon focused on building tech solutions for social impact.',
    organizer: 'Developer Club',
    status: 'approved',
    attendees: 120
  }
];

const sampleNotifications = [
  {
    id: 1,
    text: '<strong>Annual Tech Symposium</strong> has been approved by the admin.',
    time: '2 hours ago',
    read: false
  },
  {
    id: 2,
    text: 'New event submission: <strong>Workshop on ML Basics</strong> awaiting approval.',
    time: '5 hours ago',
    read: false
  },
  {
    id: 3,
    text: '<strong>Cultural Festival</strong> registration is now open for all students.',
    time: '1 day ago',
    read: true
  },
  {
    id: 4,
    text: 'Reminder: <strong>Inter-College Sports Meet</strong> registrations close in 3 days.',
    time: '2 days ago',
    read: true
  }
];

// ---------- Utility Functions ----------

function formatDate(dateStr) {
  var d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getDay(dateStr) {
  return new Date(dateStr).getDate();
}

function getMonth(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
}

function getStatusBadge(status) {
  var classes = {
    approved: 'badge-approved',
    pending: 'badge-pending',
    rejected: 'badge-rejected'
  };
  return '<span class="badge ' + (classes[status] || 'badge-info') + '">' +
    status.charAt(0).toUpperCase() + status.slice(1) + '</span>';
}

// ---------- Toast Notifications ----------

function showToast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  var icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML =
    '<span class="toast-icon">' + (icons[type] || 'ℹ️') + '</span>' +
    '<span class="toast-message">' + message + '</span>';

  container.appendChild(toast);

  setTimeout(function () {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(function () { toast.remove(); }, 300);
  }, 3500);
}

// ---------- Modal Functions ----------

function openModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  var modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// Close modal on overlay click
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ---------- Navigation ----------

function toggleMobileNav() {
  var nav = document.querySelector('.navbar-nav');
  if (nav) {
    nav.classList.toggle('open');
  }
}

function toggleSidebar() {
  var sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
}

// ---------- Landing Page ----------

function initLandingPage() {
  // Check backend status
  checkBackendStatus();
}

function checkBackendStatus() {
  fetch(API_BASE + '/')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      console.log('Backend status:', data.status);
    })
    .catch(function () {
      console.log('Backend not available — running in demo mode');
    });
}

// ---------- Login Page ----------

function initLoginPage() {
  var roleOptions = document.querySelectorAll('.role-option');
  roleOptions.forEach(function (option) {
    option.addEventListener('click', function () {
      roleOptions.forEach(function (o) { o.classList.remove('active'); });
      option.classList.add('active');
    });
  });

  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

function handleLogin(e) {
  e.preventDefault();

  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;
  var activeRole = document.querySelector('.role-option.active');

  if (!email || !password) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  if (!activeRole) {
    showToast('Please select a role.', 'error');
    return;
  }

  var role = activeRole.dataset.role;

  // Demo login
  localStorage.setItem('acadsync_user', JSON.stringify({
    name: email.split('@')[0],
    email: email,
    role: role
  }));

  showToast('Login successful! Redirecting...', 'success');

  setTimeout(function () {
    if (role === 'admin') {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }, 1000);
}

// ---------- Student Dashboard ----------

function initDashboard() {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  updateUserDisplay(user);
  renderStudentStats();
  renderUpcomingEvents();
  renderNotifications();
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('acadsync_user'));
  } catch (e) {
    return null;
  }
}

function updateUserDisplay(user) {
  var nameEl = document.querySelector('.user-name');
  var roleEl = document.querySelector('.user-role');
  var avatarEl = document.querySelector('.sidebar-user .avatar');

  if (nameEl) nameEl.textContent = user.name || 'User';
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrator' : 'Student';
  if (avatarEl) avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
}

function renderStudentStats() {
  var approvedCount = sampleEvents.filter(function (e) { return e.status === 'approved'; }).length;
  var totalAttendees = sampleEvents.reduce(function (sum, e) { return sum + e.attendees; }, 0);

  var stats = [
    { label: 'Upcoming Events', value: approvedCount, icon: '📅', colorClass: 'purple' },
    { label: 'Notifications', value: sampleNotifications.filter(function (n) { return !n.read; }).length, icon: '🔔', colorClass: 'blue' },
    { label: 'Registered Events', value: 3, icon: '✅', colorClass: 'green' },
    { label: 'Total Attendees', value: totalAttendees, icon: '👥', colorClass: 'amber' }
  ];

  var grid = document.getElementById('stats-grid');
  if (!grid) return;

  grid.innerHTML = stats.map(function (s) {
    return '<div class="stat-card">' +
      '<div class="stat-icon ' + s.colorClass + '">' + s.icon + '</div>' +
      '<div>' +
        '<div class="stat-value">' + s.value + '</div>' +
        '<div class="stat-label">' + s.label + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderUpcomingEvents() {
  var container = document.getElementById('upcoming-events');
  if (!container) return;

  var approved = sampleEvents.filter(function (e) { return e.status === 'approved'; });

  container.innerHTML = approved.map(function (event) {
    return '<div class="event-item">' +
      '<div class="event-date">' +
        '<div class="day">' + getDay(event.date) + '</div>' +
        '<div class="month">' + getMonth(event.date) + '</div>' +
      '</div>' +
      '<div class="event-info">' +
        '<h4>' + event.title + '</h4>' +
        '<p>📍 ' + event.location + ' · ⏰ ' + event.time + '</p>' +
      '</div>' +
      '<div class="event-actions">' +
        getStatusBadge(event.status) +
      '</div>' +
    '</div>';
  }).join('');
}

function renderNotifications() {
  var container = document.getElementById('notifications-list');
  if (!container) return;

  container.innerHTML = sampleNotifications.map(function (n) {
    return '<div class="notification-item">' +
      '<div class="notification-dot ' + (n.read ? 'read' : '') + '"></div>' +
      '<div>' +
        '<div class="notification-text">' + n.text + '</div>' +
        '<div class="notification-time">' + n.time + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ---------- Admin Dashboard ----------

function initAdminDashboard() {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  updateUserDisplay(user);
  renderAdminStats();
  renderPendingApprovals();
  renderAllEventsTable();
  renderNotifications();
}

function renderAdminStats() {
  var pending = sampleEvents.filter(function (e) { return e.status === 'pending'; }).length;
  var approved = sampleEvents.filter(function (e) { return e.status === 'approved'; }).length;

  var stats = [
    { label: 'Total Events', value: sampleEvents.length, icon: '📋', colorClass: 'purple' },
    { label: 'Pending Approval', value: pending, icon: '⏳', colorClass: 'amber' },
    { label: 'Approved', value: approved, icon: '✅', colorClass: 'green' },
    { label: 'Notifications', value: sampleNotifications.filter(function (n) { return !n.read; }).length, icon: '🔔', colorClass: 'blue' }
  ];

  var grid = document.getElementById('stats-grid');
  if (!grid) return;

  grid.innerHTML = stats.map(function (s) {
    return '<div class="stat-card">' +
      '<div class="stat-icon ' + s.colorClass + '">' + s.icon + '</div>' +
      '<div>' +
        '<div class="stat-value">' + s.value + '</div>' +
        '<div class="stat-label">' + s.label + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderPendingApprovals() {
  var container = document.getElementById('pending-approvals');
  if (!container) return;

  var pending = sampleEvents.filter(function (e) { return e.status === 'pending'; });

  if (pending.length === 0) {
    container.innerHTML = '<div class="empty-state">' +
      '<div class="empty-icon">🎉</div>' +
      '<h3>All caught up!</h3>' +
      '<p>No events pending approval.</p>' +
    '</div>';
    return;
  }

  container.innerHTML = pending.map(function (event) {
    return '<div class="event-item">' +
      '<div class="event-date">' +
        '<div class="day">' + getDay(event.date) + '</div>' +
        '<div class="month">' + getMonth(event.date) + '</div>' +
      '</div>' +
      '<div class="event-info">' +
        '<h4>' + event.title + '</h4>' +
        '<p>By ' + event.organizer + ' · 📍 ' + event.location + '</p>' +
      '</div>' +
      '<div class="event-actions">' +
        '<button class="btn btn-success btn-sm" onclick="approveEvent(' + event.id + ')">Approve</button>' +
        '<button class="btn btn-danger btn-sm" onclick="rejectEvent(' + event.id + ')">Reject</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderAllEventsTable() {
  var tbody = document.getElementById('events-tbody');
  if (!tbody) return;

  tbody.innerHTML = sampleEvents.map(function (event) {
    return '<tr>' +
      '<td><strong>' + event.title + '</strong></td>' +
      '<td>' + event.type + '</td>' +
      '<td>' + formatDate(event.date) + '</td>' +
      '<td>' + event.organizer + '</td>' +
      '<td>' + getStatusBadge(event.status) + '</td>' +
      '<td>' +
        '<button class="btn btn-outline btn-sm" onclick="viewEventDetails(' + event.id + ')">View</button>' +
      '</td>' +
    '</tr>';
  }).join('');
}

function approveEvent(id) {
  var event = sampleEvents.find(function (e) { return e.id === id; });
  if (event) {
    event.status = 'approved';
    showToast('"' + event.title + '" has been approved!', 'success');
    renderPendingApprovals();
    renderAllEventsTable();
    renderAdminStats();
  }
}

function rejectEvent(id) {
  var event = sampleEvents.find(function (e) { return e.id === id; });
  if (event) {
    event.status = 'rejected';
    showToast('"' + event.title + '" has been rejected.', 'error');
    renderPendingApprovals();
    renderAllEventsTable();
    renderAdminStats();
  }
}

function viewEventDetails(id) {
  var event = sampleEvents.find(function (e) { return e.id === id; });
  if (!event) return;

  var body = document.getElementById('event-detail-body');
  if (body) {
    body.innerHTML =
      '<div class="form-group"><label>Title</label><p>' + event.title + '</p></div>' +
      '<div class="form-group"><label>Type</label><p>' + event.type + '</p></div>' +
      '<div class="form-group"><label>Date & Time</label><p>' + formatDate(event.date) + ' at ' + event.time + '</p></div>' +
      '<div class="form-group"><label>Location</label><p>' + event.location + '</p></div>' +
      '<div class="form-group"><label>Organizer</label><p>' + event.organizer + '</p></div>' +
      '<div class="form-group"><label>Description</label><p>' + event.description + '</p></div>' +
      '<div class="form-group"><label>Status</label>' + getStatusBadge(event.status) + '</div>' +
      '<div class="form-group"><label>Expected Attendees</label><p>' + event.attendees + '</p></div>';
  }
  openModal('event-detail-modal');
}

// ---------- Events Page ----------

function initEventsPage() {
  var user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  updateUserDisplay(user);
  renderEventsGrid(sampleEvents);
  setupEventFilters();
  setupEventSearch();
}

function renderEventsGrid(events) {
  var grid = document.getElementById('events-grid');
  if (!grid) return;

  if (events.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;">' +
      '<div class="empty-icon">🔍</div>' +
      '<h3>No events found</h3>' +
      '<p>Try adjusting your search or filters.</p>' +
    '</div>';
    return;
  }

  var headerColors = {
    Academic: 'linear-gradient(135deg, #4f46e5, #6366f1)',
    Cultural: 'linear-gradient(135deg, #ec4899, #f472b6)',
    Workshop: 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    Sports: 'linear-gradient(135deg, #10b981, #34d399)'
  };

  grid.innerHTML = events.map(function (event) {
    var bg = headerColors[event.type] || headerColors.Academic;
    return '<div class="event-card">' +
      '<div class="event-card-header" style="background:' + bg + ';">' +
        '<div class="event-type">' + event.type + '</div>' +
        '<h3>' + event.title + '</h3>' +
      '</div>' +
      '<div class="event-card-body">' +
        '<div class="event-meta">' +
          '<div class="event-meta-item"><span class="meta-icon">📅</span> ' + formatDate(event.date) + ' at ' + event.time + '</div>' +
          '<div class="event-meta-item"><span class="meta-icon">📍</span> ' + event.location + '</div>' +
          '<div class="event-meta-item"><span class="meta-icon">👤</span> ' + event.organizer + '</div>' +
        '</div>' +
        '<p style="font-size:0.875rem;color:var(--text-light);line-height:1.6;">' + event.description + '</p>' +
      '</div>' +
      '<div class="event-card-footer">' +
        getStatusBadge(event.status) +
        '<span style="font-size:0.813rem;color:var(--text-light);">👥 ' + event.attendees + ' attendees</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function setupEventFilters() {
  var tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var filter = tab.dataset.filter;
      if (filter === 'all') {
        renderEventsGrid(sampleEvents);
      } else {
        var filtered = sampleEvents.filter(function (e) {
          return e.type.toLowerCase() === filter;
        });
        renderEventsGrid(filtered);
      }
    });
  });
}

function setupEventSearch() {
  var searchInput = document.getElementById('event-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', function () {
    var query = searchInput.value.toLowerCase();
    var filtered = sampleEvents.filter(function (e) {
      return e.title.toLowerCase().indexOf(query) !== -1 ||
             e.description.toLowerCase().indexOf(query) !== -1 ||
             e.organizer.toLowerCase().indexOf(query) !== -1;
    });
    renderEventsGrid(filtered);
  });
}

// ---------- Event Submission ----------

function handleEventSubmit(e) {
  e.preventDefault();

  var title = document.getElementById('event-title').value.trim();
  var type = document.getElementById('event-type').value;
  var date = document.getElementById('event-date').value;
  var time = document.getElementById('event-time').value;
  var location = document.getElementById('event-location').value.trim();
  var description = document.getElementById('event-description').value.trim();

  if (!title || !type || !date || !time || !location || !description) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  var newEvent = {
    id: sampleEvents.length + 1,
    title: title,
    type: type,
    date: date,
    time: time,
    location: location,
    description: description,
    organizer: getCurrentUser() ? getCurrentUser().name : 'Unknown',
    status: 'pending',
    attendees: 0
  };

  sampleEvents.push(newEvent);
  showToast('Event submitted for approval!', 'success');
  closeModal('new-event-modal');

  // Reset form
  e.target.reset();

  // Refresh views
  if (typeof renderEventsGrid === 'function') {
    renderEventsGrid(sampleEvents);
  }
}

// ---------- Logout ----------

function logout() {
  localStorage.removeItem('acadsync_user');
  showToast('Logged out successfully.', 'success');
  setTimeout(function () {
    window.location.href = 'index.html';
  }, 500);
}

// ---------- Auto-Init ----------
document.addEventListener('DOMContentLoaded', function () {
  var page = document.body.dataset.page;

  switch (page) {
    case 'landing':
      initLandingPage();
      break;
    case 'login':
      initLoginPage();
      break;
    case 'dashboard':
      initDashboard();
      break;
    case 'admin':
      initAdminDashboard();
      break;
    case 'events':
      initEventsPage();
      break;
  }
});
