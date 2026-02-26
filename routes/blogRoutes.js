const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const blogController = require('../controllers/blogController');

// ================= MULTER CONFIG =================
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================= PUBLIC ROUTES =================

// Get all blogs
router.get('/', blogController.getAllBlogs);

// ================= ADMIN ROUTES =================

// Get all blogs for admin
router.get('/admin/all', blogController.getAllBlogsAdmin);

// Create blog
router.post('/', upload.single('image'), blogController.createBlog);

// Update blog
router.put('/:id', upload.single('image'), blogController.updateBlog);

// Delete blog
router.delete('/:id', blogController.deleteBlog);

// Toggle publish
router.patch('/:id/toggle', blogController.togglePublish);

// ✅ GET SINGLE BLOG BY ID (PUT AT BOTTOM)
router.get('/:id', blogController.getBlogById);

module.exports = router;