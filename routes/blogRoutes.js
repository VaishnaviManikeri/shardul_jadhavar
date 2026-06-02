const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const authMiddleware = require('../middleware/auth');
const { uploadBlogImage } = require('../middleware/uploadBlog');

// Public routes (no authentication)
router.get('/', blogController.getAllBlogs);
router.get('/categories/all', blogController.getCategories);
router.get('/:slug', blogController.getBlogBySlug);

// Admin routes (with authentication)
router.get('/admin/all', authMiddleware, blogController.getAllBlogsAdmin);
router.get('/admin/:id', authMiddleware, blogController.getBlogById);
router.post('/', authMiddleware, uploadBlogImage.single('featuredImage'), blogController.createBlog);
router.put('/:id', authMiddleware, uploadBlogImage.single('featuredImage'), blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.patch('/:id/toggle-publish', authMiddleware, blogController.togglePublish);

module.exports = router;
