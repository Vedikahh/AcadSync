require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Connect to MongoDB
connectDB();

const app = express();

const parseAllowedOrigins = () => {
  const combined = [process.env.CLIENT_URL, process.env.ALLOWED_ORIGINS]
    .filter(Boolean)
    .join(',');

  return combined
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (no Origin header) like health checks and curl.
    if (!origin) {
      return callback(null, true);
    }

    // Safe fallback: if no origin is configured, keep existing open behavior.
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));

// Load Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Route for testing
app.get('/', (req, res) => {
  res.send('AcadSync API is running...');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Init socket.io
const socketIO = require('./utils/socket');
socketIO.init(server, corsOptions);

