const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');

// Configure multer for memory storage (will be sent to cloudinary)
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Admin routes (protected)
router.get('/admin/all', authMiddleware, blogController.getAllBlogsAdmin);
router.get('/admin/:id', authMiddleware, blogController.getBlogById);
router.post('/', authMiddleware, upload.single('featuredImage'), blogController.createBlog);
router.put('/:id', authMiddleware, upload.single('featuredImage'), blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.patch('/:id/toggle-publish', authMiddleware, blogController.togglePublish);

module.exports = router;