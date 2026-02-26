const Blog = require('../models/Blog');

/*
|--------------------------------------------------------------------------
| CREATE BLOG
|--------------------------------------------------------------------------
*/
exports.createBlog = async (req, res) => {
  try {
    const blog = await Blog.create(req.body);
    res.status(201).json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL BLOGS (PUBLIC)
|--------------------------------------------------------------------------
*/
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({
      createdAt: -1,
    });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL BLOGS (ADMIN)
|--------------------------------------------------------------------------
*/
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE BLOG
|--------------------------------------------------------------------------
*/
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE BLOG
|--------------------------------------------------------------------------
*/
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE BLOG
|--------------------------------------------------------------------------
*/
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};