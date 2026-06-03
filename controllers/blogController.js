const Blog = require('../models/Blog');
const fs = require('fs');
const path = require('path');

// Calculate reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
};

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .sort({ createdAt: -1 })
      .select('title slug featuredImage author createdAt readingTime tags metaTitle metaDescription');
    
    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, published: true });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment views
    blog.views += 1;
    await blog.save();
    
    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/blogs/admin/all
// @access  Private
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author, metaTitle, metaDescription, tags, published } = req.body;
    
    // Check if featured image is uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Featured image is required' });
    }
    
    // Calculate reading time from HTML content
    const readingTime = calculateReadingTime(content);
    
    const blog = new Blog({
      title,
      content,
      author: author || 'Admin',
      featuredImage: `/uploads/blogs/${req.file.filename}`,
      readingTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.replace(/<[^>]*>/g, '').substring(0, 320),
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      published: published === 'true'
    });
    
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    const { title, content, author, metaTitle, metaDescription, tags, published } = req.body;
    
    // Update fields
    if (title) blog.title = title;
    if (content) {
      blog.content = content;
      blog.readingTime = calculateReadingTime(content);
    }
    if (author) blog.author = author;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    if (tags) blog.tags = tags.split(',').map(tag => tag.trim());
    if (published !== undefined) blog.published = published === 'true';
    
    // Update image if new one is uploaded
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '..', blog.featuredImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      blog.featuredImage = `/uploads/blogs/${req.file.filename}`;
    }
    
    await blog.save();
    res.json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Delete featured image
    const imagePath = path.join(__dirname, '..', blog.featuredImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await blog.deleteOne();
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    blog.published = !blog.published;
    await blog.save();
    
    res.json({ published: blog.published });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};