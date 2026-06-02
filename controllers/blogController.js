const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Helper function to upload image to cloudinary
const uploadToCloudinary = async (filePath, folder = 'blogs') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      use_filename: true,
    });
    // Delete local file after upload
    fs.unlinkSync(filePath);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// Helper function to extract reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / wordsPerMinute);
  return Math.max(1, readingTime);
};

// @desc    Create a new blog post
// @route   POST /api/blogs
// @access  Private (Admin)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, author, tags, category, seo } = req.body;
    
    // Generate slug from title
    let slug = title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Check if slug exists, if yes, add number
    let existingBlog = await Blog.findOne({ slug });
    let counter = 1;
    while (existingBlog) {
      slug = `${slug}-${counter}`;
      existingBlog = await Blog.findOne({ slug });
      counter++;
    }
    
    // Calculate reading time
    const readingTime = calculateReadingTime(content);
    
    // Upload featured image if provided
    let featuredImage = null;
    if (req.file) {
      featuredImage = await uploadToCloudinary(req.file.path);
    }
    
    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      readingTime,
      featuredImage,
      author: {
        name: author?.name || 'Admin',
        avatar: author?.avatar || '',
      },
      tags: tags ? JSON.parse(tags) : [],
      category: category || 'General',
      seo: seo ? JSON.parse(seo) : {
        metaTitle: title,
        metaDescription: excerpt,
      },
      publishedAt: new Date(),
    });
    
    await blog.save();
    
    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all blogs (public)
// @route   GET /api/blogs
// @access  Public
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    
    let query = { isPublished: true };
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (tag) {
      query.tags = tag;
    }
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');
    
    const total = await Blog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    
    // Increment views
    blog.views += 1;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/blogs/admin/all
// @access  Private
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: blogs,
    });
  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get single blog by ID (admin)
// @route   GET /api/blogs/admin/:id
// @access  Private
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, excerpt, author, tags, category, seo, isPublished } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    
    // Update slug if title changed
    let slug = blog.slug;
    if (title && title !== blog.title) {
      slug = title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check for duplicate slug
      let existingBlog = await Blog.findOne({ slug, _id: { $ne: req.params.id } });
      let counter = 1;
      while (existingBlog) {
        slug = `${slug}-${counter}`;
        existingBlog = await Blog.findOne({ slug, _id: { $ne: req.params.id } });
        counter++;
      }
    }
    
    // Calculate reading time if content changed
    let readingTime = blog.readingTime;
    if (content) {
      readingTime = calculateReadingTime(content);
    }
    
    // Upload new featured image if provided
    let featuredImage = blog.featuredImage;
    if (req.file) {
      // Delete old image from cloudinary
      if (blog.featuredImage?.publicId) {
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      }
      featuredImage = await uploadToCloudinary(req.file.path);
    }
    
    const updatedData = {
      ...(title && { title, slug }),
      ...(content && { content, readingTime }),
      ...(excerpt && { excerpt }),
      ...(author && { author: { name: author.name, avatar: author.avatar } }),
      ...(tags && { tags: JSON.parse(tags) }),
      ...(category && { category }),
      ...(seo && { seo: JSON.parse(seo) }),
      ...(isPublished !== undefined && { isPublished }),
      ...(featuredImage && { featuredImage }),
      updatedAt: Date.now(),
    };
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: updatedBlog,
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    
    // Delete image from cloudinary
    if (blog.featuredImage?.publicId) {
      await cloudinary.uploader.destroy(blog.featuredImage.publicId);
    }
    
    await blog.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Toggle publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        error: 'Blog not found',
      });
    }
    
    blog.isPublished = !blog.isPublished;
    blog.updatedAt = Date.now();
    await blog.save();
    
    res.status(200).json({
      success: true,
      message: `Blog ${blog.isPublished ? 'published' : 'unpublished'} successfully`,
      data: blog,
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};