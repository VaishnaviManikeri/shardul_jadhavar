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

// ================= CORS CONFIG =================
const allowedOrigins = [
  'http://localhost:5173',      // Vite local
  'http://localhost:3000',      // React local
  'https://sharduljadhavar.com', // ✅ Production frontend
  'https://www.sharduljadhavar.com'
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, mobile apps

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  })
);

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= STATIC FOLDER =================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ================= TEST ROUTES =================
app.get('/', (req, res) => {
  res.send('Backend is running successfully 🚀');
});

// ================= ✅ PING ROUTE (ADDED) =================
app.get('/ping', (req, res) => {
  res.send('✅ Server is alive');
});

app.use('/api/test', require('./routes/testRoutes'));

// ================= MAIN ROUTES =================
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
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    details: err.message,
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5026;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
