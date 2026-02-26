const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// ================= LOAD ENV VARIABLES =================
dotenv.config();

// ================= CONNECT DATABASE =================
connectDB();

const app = express();

// ================= CORRECT CORS =================
// Replace FRONTEND_URL in .env with your deployed frontend URL
// Example: FRONTEND_URL=https://law5years.onrender.com

const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite local
      'http://localhost:3000', // React local
      FRONTEND_URL, // Deployed frontend
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= SERVE UPLOADS =================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= ROOT TEST ROUTE =================
app.get('/', (req, res) => {
  res.send('Backend is running successfully 🚀');
});

// ================= ROUTES =================
app.use('/api/test', require('./routes/testRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/careers', require('./routes/careerRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message,
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});