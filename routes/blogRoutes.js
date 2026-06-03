const express = require('express');
const router = express.Router();
const {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getAllBlogsAdmin,
  togglePublish
} = require('../controllers/blogController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', getAllBlogs);
router.get('/:id', getBlogById);

// Admin routes (protected)
router.get('/admin/all', auth, getAllBlogsAdmin);
router.post('/', auth, createBlog);
router.put('/:id', auth, updateBlog);
router.delete('/:id', auth, deleteBlog);
router.patch('/:id/toggle-publish', auth, togglePublish);

module.exports = router;