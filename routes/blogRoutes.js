const express = require('express');
const router = express.Router();
const {
  createBlog,
  getBlogs,
  getAllBlogsAdmin,
  getBlogById,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');

// PUBLIC
router.get('/', getBlogs);
router.get('/:id', getBlogById);

// ADMIN
router.get('/admin/all', getAllBlogsAdmin);
router.post('/', createBlog);
router.put('/:id', updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;