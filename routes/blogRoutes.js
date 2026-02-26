const express = require('express');
const router = express.Router();
const upload = require('../middleware/Blogupload');

const {
  createBlog,
  getBlogs,
  getAllBlogsAdmin,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogController');

router.get('/', getBlogs);
router.get('/admin/all', getAllBlogsAdmin);
router.get('/slug/:slug', getBlogBySlug);
router.get('/:id', getBlogById);

router.post('/', upload.single('image'), createBlog);
router.put('/:id', upload.single('image'), updateBlog);
router.delete('/:id', deleteBlog);

module.exports = router;