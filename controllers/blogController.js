const Blog = require('../models/Blog');

// Helper function to calculate reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime);
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private (Admin only)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, featuredImage, author, metaTitle, metaDescription } = req.body;
    
    const readingTime = calculateReadingTime(content);
    
    const blog = await Blog.create({
      title,
      content,
      featuredImage,
      author: author || 'Admin',
      readingTime,
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || content.substring(0, 160).replace(/<[^>]*>/g, '')
    });
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all blog posts (public)
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const blogs = await Blog.find({ isPublished: true })
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Blog.countDocuments({ isPublished: true });
    
    res.status(200).json({
      success: true,
      data: blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single blog post by ID
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }
    
    // Increment view count
    blog.views += 1;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update blog post
// @route   PUT /api/blogs/:id
// @access  Private (Admin only)
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, featuredImage, author, metaTitle, metaDescription, isPublished } = req.body;
    
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }
    
    const readingTime = content ? calculateReadingTime(content) : blog.readingTime;
    
    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title: title || blog.title,
        content: content || blog.content,
        featuredImage: featuredImage !== undefined ? featuredImage : blog.featuredImage,
        author: author || blog.author,
        readingTime,
        metaTitle: metaTitle || blog.metaTitle,
        metaDescription: metaDescription || blog.metaDescription,
        isPublished: isPublished !== undefined ? isPublished : blog.isPublished
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete blog post
// @route   DELETE /api/blogs/:id
// @access  Private (Admin only)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }
    
    await blog.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/blogs/admin/all
// @access  Private (Admin only)
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private (Admin only)
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found'
      });
    }
    
    blog.isPublished = !blog.isPublished;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};