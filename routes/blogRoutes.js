const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'blog-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Public routes (no authentication)
router.get('/', blogController.getAllBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Admin routes (with authentication)
router.get('/admin/all', authMiddleware, blogController.getAllBlogsAdmin);
router.get('/admin/:id', authMiddleware, blogController.getBlogById);
router.post('/', authMiddleware, upload.single('featuredImage'), blogController.createBlog);
router.put('/:id', authMiddleware, upload.single('featuredImage'), blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.patch('/:id/toggle-publish', authMiddleware, blogController.togglePublish);

module.exports = router;