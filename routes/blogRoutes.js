const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');

<<<<<<< HEAD
// Configure multer for memory storage (will be sent to cloudinary)
const storage = multer.diskStorage({
=======
// Configure multer for disk storage (temporary)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Make sure this directory exists
  },
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
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
<<<<<<< HEAD
});

=======
}).single('featuredImage');

// Wrapper for multer error handling
const handleMulterError = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Admin routes (protected)
router.get('/admin/all', authMiddleware, blogController.getAllBlogsAdmin);
router.get('/admin/:id', authMiddleware, blogController.getBlogById);
<<<<<<< HEAD
router.post('/', authMiddleware, upload.single('featuredImage'), blogController.createBlog);
router.put('/:id', authMiddleware, upload.single('featuredImage'), blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.patch('/:id/toggle-publish', authMiddleware, blogController.togglePublish);

module.exports = router;
=======
router.post('/', authMiddleware, handleMulterError, blogController.createBlog);
router.put('/:id', authMiddleware, handleMulterError, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.patch('/:id/toggle-publish', authMiddleware, blogController.togglePublish);

module.exports = router;
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
