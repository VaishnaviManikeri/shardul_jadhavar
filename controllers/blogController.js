const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private (Admin only)
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      metaTitle,
      metaDescription,
      author,
      content,
      readingTime,
      tags,
      seoKeywords,
      featuredImage,
    } = req.body;

    // Check if blog with same title exists
    const existingBlog = await Blog.findOne({ title });
    if (existingBlog) {
      return res.status(400).json({ error: 'Blog with this title already exists' });
    }

    const blog = await Blog.create({
      title,
      metaTitle,
      metaDescription,
      author: author || 'Admin',
      content,
      readingTime: readingTime || calculateReadingTime(content),
      tags: tags ? JSON.parse(tags) : [],
      seoKeywords: seoKeywords ? JSON.parse(seoKeywords) : [],
      featuredImage,
    });

    res.status(201).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all blogs (public)
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, published = 'true' } = req.query;
    
    const query = published === 'true' ? { isPublished: true } : {};
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');

    const total = await Blog.countDocuments(query);

    res.status(200).json({
      success: true,
      data: blogs,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment view count
    blog.viewCount += 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Admin only)
exports.updateBlog = async (req, res) => {
  try {
    const {
      title,
      metaTitle,
      metaDescription,
      author,
      content,
      readingTime,
      tags,
      seoKeywords,
      featuredImage,
      isPublished,
    } = req.body;

    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Update fields
    blog.title = title || blog.title;
    blog.metaTitle = metaTitle || blog.metaTitle;
    blog.metaDescription = metaDescription || blog.metaDescription;
    blog.author = author || blog.author;
    blog.content = content || blog.content;
    blog.readingTime = readingTime || calculateReadingTime(content);
    blog.tags = tags ? JSON.parse(tags) : blog.tags;
    blog.seoKeywords = seoKeywords ? JSON.parse(seoKeywords) : blog.seoKeywords;
    blog.featuredImage = featuredImage || blog.featuredImage;
    
    if (typeof isPublished === 'boolean') {
      blog.isPublished = isPublished;
    }

    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin only)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Delete image from Cloudinary if exists
    if (blog.featuredImagePublicId) {
      await cloudinary.uploader.destroy(blog.featuredImagePublicId);
    }

    await blog.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private (Admin only)
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.isPublished = !blog.isPublished;
    if (blog.isPublished) {
      blog.publishedAt = new Date();
    }
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Upload image for blog
// @route   POST /api/blogs/upload-image
// @access  Private (Admin only)
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'blogs',
      transformation: [
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      imageUrl: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to calculate reading time
function calculateReadingTime(content) {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime);
}
