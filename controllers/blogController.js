const Blog = require('../models/Blog');
const path = require('path');
const fs = require('fs');

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private (Admin only)
exports.createBlog = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { title, content, excerpt, author, tags, category, isPublished, isFeatured, metaTitle, metaDescription } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Featured image is required' });
    }
    
    // Parse tags if it's a string
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim());
      }
    }
    
    // Calculate reading time (approx 200 words per minute)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    const blog = new Blog({
      title: title.trim(),
      content: content,
      excerpt: excerpt || '',
      featuredImage: `/uploads/blogs/${req.file.filename}`,
      author: author || 'Admin',
      readingTime: readingTime,
      tags: parsedTags,
      category: category || 'General',
      isPublished: isPublished === 'true' || isPublished === true,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || content.substring(0, 160).replace(/<[^>]*>/g, '')
    });
    
    await blog.save();
    
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error in createBlog:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all blog posts (public)
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search } = req.query;
    
    let query = { isPublished: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      data: blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single blog post (public)
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Increment view count
    blog.views += 1;
    await blog.save();
    
    // Get related posts (same category or tags)
    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      isPublished: true,
      $or: [
        { category: blog.category },
        { tags: { $in: blog.tags } }
      ]
    })
    .limit(3)
    .select('title featuredImage publishedAt readingTime');
    
    res.json({
      success: true,
      data: blog,
      relatedPosts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/blogs/admin/all
// @access  Private
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    console.log('Update request body:', req.body);
    console.log('Update request file:', req.file);
    
    const { title, content, excerpt, author, tags, category, isPublished, isFeatured, metaTitle, metaDescription } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Parse tags if it's a string
    let parsedTags = blog.tags;
    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim());
      }
    }
    
    // Update fields
    if (title) blog.title = title.trim();
    if (content) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt;
    if (author) blog.author = author;
    blog.tags = parsedTags;
    if (category) blog.category = category;
    blog.isPublished = isPublished === 'true' || isPublished === true;
    blog.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    
    // Update featured image if new one uploaded
    if (req.file) {
      // Delete old image
      const oldImagePath = path.join(__dirname, '..', blog.featuredImage);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      blog.featuredImage = `/uploads/blogs/${req.file.filename}`;
    }
    
    // Update reading time
    const wordCount = blog.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    blog.readingTime = Math.max(1, Math.ceil(wordCount / 200));
    
    await blog.save();
    
    res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error in updateBlog:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    // Delete featured image
    const imagePath = path.join(__dirname, '..', blog.featuredImage);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    await blog.deleteOne();
    
    res.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    blog.isPublished = !blog.isPublished;
    await blog.save();
    
    res.json({
      success: true,
      message: `Blog ${blog.isPublished ? 'published' : 'unpublished'} successfully`,
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
