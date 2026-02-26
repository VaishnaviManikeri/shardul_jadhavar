const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const blogController = require('../controllers/blogController');

// Multer storage
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// PUBLIC
router.get('/', blogController.getAllBlogs);

// ADMIN
router.get('/admin/all', blogController.getAllBlogsAdmin);
router.post('/', upload.single('image'), blogController.createBlog);
router.put('/:id', upload.single('image'), blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);
router.patch('/:id/toggle', blogController.togglePublish);

module.exports = router;