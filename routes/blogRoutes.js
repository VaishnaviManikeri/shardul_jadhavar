const express = require('express');
const router = express.Router();
const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  togglePublish,
  uploadImage,
} = require('../controllers/blogController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public routes
router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);

// Protected admin routes
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.patch('/:id/toggle-publish', protect, togglePublish);
router.post('/upload-image', protect, upload.single('image'), uploadImage);

module.exports = router;
