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

// ================= MIDDLEWARE =================
app.use(
  cors({
    origin: '*', // allow all (safe for now; can restrict later)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= TEST ROUTES =================

// Root test route (VERY IMPORTANT for Render 404 check)
app.get('/', (req, res) => {
  res.send('Backend is running successfully 🚀');
});

// API test route
app.use('/api/test', require('./routes/testRoutes'));

// ================= MAIN ROUTES =================
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/careers', require('./routes/careerRoutes'));
app.use('/api/videos', require('./routes/videoRoutes')); // Add this line
app.use('/api/blogs', require('./routes/blogRoutes'));
// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ error: 'API route not found' });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err.stack);
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
