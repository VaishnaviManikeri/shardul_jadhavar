const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const connectDB = require('./config/database');

// ================= LOAD ENV VARIABLES =================
dotenv.config();

// ================= CONNECT DATABASE =================
connectDB();

const app = express();

// ================= CREATE UPLOADS DIRECTORY STRUCTURE =================
const createUploadDirectories = () => {
  const uploadDirs = [
    path.join(__dirname, 'uploads'),
    path.join(__dirname, 'uploads/blogs'),
    path.join(__dirname, 'uploads/gallery'),
    path.join(__dirname, 'uploads/videos'),
    path.join(__dirname, 'uploads/announcements'),
    path.join(__dirname, 'uploads/careers'),
    path.join(__dirname, 'uploads/profile')
  ];

  uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } else {
      console.log(`✅ Directory already exists: ${dir}`);
    }
  });
};

// Call function to create directories
createUploadDirectories();

// ================= CORS CONFIGURATION =================
const allowedOrigins = [
  'http://localhost:5173',      // Vite local
  'http://localhost:3000',      // React local
  'http://localhost:5000',      // Alternate local
  'http://localhost:5026',      // Backend local
  'https://sharduljadhavar.com', // Production frontend
  'https://www.sharduljadhavar.com', // Production with www
  'https://api.sharduljadhavar.com' // API domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`⚠️ CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
  })
);

// ================= BODY PARSER =================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ================= STATIC FOLDERS =================
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/blogs', express.static(path.join(__dirname, 'uploads/blogs')));
app.use('/uploads/gallery', express.static(path.join(__dirname, 'uploads/gallery')));
app.use('/uploads/videos', express.static(path.join(__dirname, 'uploads/videos')));

// ================= REQUEST LOGGER (for debugging) =================
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// ================= HEALTH CHECK & TEST ROUTES =================
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend API is running successfully 🚀',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      admin: '/api/admin',
      blogs: '/api/blogs',
      gallery: '/api/gallery',
      announcements: '/api/announcements',
      careers: '/api/careers',
      videos: '/api/videos',
      test: '/api/test',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    directories: {
      uploads: fs.existsSync(path.join(__dirname, 'uploads')),
      blogs: fs.existsSync(path.join(__dirname, 'uploads/blogs')),
      gallery: fs.existsSync(path.join(__dirname, 'uploads/gallery')),
      videos: fs.existsSync(path.join(__dirname, 'uploads/videos'))
    }
  });
});

// Test endpoint to verify blog upload
app.post('/api/test-upload', (req, res) => {
  res.json({ message: 'Upload test endpoint working' });
});

app.use('/api/test', require('./routes/testRoutes'));

// ================= MAIN API ROUTES =================
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/careers', require('./routes/careerRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'API route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/admin',
      '/api/blogs',
      '/api/gallery',
      '/api/announcements',
      '/api/careers',
      '/api/videos',
      '/api/test',
      '/api/health'
    ]
  });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 5MB',
      code: 'FILE_TOO_LARGE'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected field in form data',
      code: 'UNEXPECTED_FIELD'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      error: 'Too many files uploaded',
      code: 'TOO_MANY_FILES'
    });
  }
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS not allowed for this origin',
      code: 'CORS_ERROR'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: messages,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `Duplicate value for ${field}. Please use a unique value.`,
      code: 'DUPLICATE_KEY'
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Default error response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5026;

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('='.repeat(60));
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Local API URL: http://localhost:${PORT}`);
  console.log(`🔗 Production API URL: https://api.sharduljadhavar.com`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log('\n📂 Upload directories created:');
  console.log(`   ├─ blogs: ${fs.existsSync(path.join(__dirname, 'uploads/blogs')) ? '✅' : '❌'}`);
  console.log(`   ├─ gallery: ${fs.existsSync(path.join(__dirname, 'uploads/gallery')) ? '✅' : '❌'}`);
  console.log(`   ├─ videos: ${fs.existsSync(path.join(__dirname, 'uploads/videos')) ? '✅' : '❌'}`);
  console.log(`   └─ announcements: ${fs.existsSync(path.join(__dirname, 'uploads/announcements')) ? '✅' : '❌'}`);
  console.log('\n✅ All routes loaded successfully!');
  console.log('='.repeat(60) + '\n');
});

// ================= GRACEFUL SHUTDOWN =================
const gracefulShutdown = (signal) => {
  console.log(`\n⚠️ ${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

module.exports = app;