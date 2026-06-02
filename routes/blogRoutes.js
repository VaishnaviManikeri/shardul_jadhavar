const express = require('express');
const router = express.Router();
const {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  togglePublish,
  getAdminBlogs
} = require('../controllers/blogController');
const auth = require('../middleware/auth');
const upload = require('../middleware/uploadBlog');

// Public routes
router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);

// Admin routes (protected)
router.get('/admin/all', auth, getAdminBlogs);
router.post('/', auth, upload.single('featuredImage'), createBlog);
router.put('/:id', auth, upload.single('featuredImage'), updateBlog);
router.delete('/:id', auth, deleteBlog);
router.patch('/:id/toggle-publish', auth, togglePublish);

module.exports = router;
