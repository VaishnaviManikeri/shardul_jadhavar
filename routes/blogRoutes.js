const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  togglePublish,
  toggleFeatured,
  getFeaturedBlogs
} = require('../controllers/blogController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadBlog');

// Public routes
router.get('/', getAllBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);

// Admin routes (protected)
router.post('/', auth, upload.single('featuredImage'), createBlog);
router.put('/:id', auth, upload.single('featuredImage'), updateBlog);
router.delete('/:id', auth, deleteBlog);
router.patch('/:id/toggle-publish', auth, togglePublish);
router.patch('/:id/toggle-featured', auth, toggleFeatured);

module.exports = router;
