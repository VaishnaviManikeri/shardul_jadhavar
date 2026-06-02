const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

// Helper function to upload image to cloudinary
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'blogs',
      resource_type: 'auto',
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

// @desc    Get all published blogs (public)
// @route   GET /api/blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    const query = { isPublished: true };

    if (category) query.category = category;
    if (tag) query.tags = tag;

    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Blog.countDocuments(query);

    res.json({
      success: true,
      blogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single blog by slug (public)
// @route   GET /api/blogs/:slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Increment views
    blog.views += 1;
    await blog.save();

    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all blogs (admin)
// @route   GET /api/blogs/admin/all
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      blogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single blog by ID (admin)
// @route   GET /api/blogs/admin/:id
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, author, tags, category, seo, isPublished } = req.body;

    // Calculate reading time (average reading speed: 200 words per minute)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    let featuredImage = null;
    if (req.file) {
      featuredImage = await uploadToCloudinary(req.file);
    }

    const blog = await Blog.create({
      title,
      content,
      excerpt,
      readingTime,
      featuredImage,
      author: author || { name: 'Shardul Jadhavar' },
      tags: tags ? JSON.parse(tags) : [],
      category,
      seo: seo ? JSON.parse(seo) : {},
      isPublished: isPublished === 'true',
    });

    res.status(201).json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const { title, content, excerpt, author, tags, category, seo, isPublished } = req.body;

    // Update reading time if content changed
    let readingTime = blog.readingTime;
    if (content) {
      const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
      readingTime = Math.ceil(wordCount / 200);
    }

    let featuredImage = blog.featuredImage;
    if (req.file) {
      // Delete old image from cloudinary if exists
      if (blog.featuredImage?.publicId) {
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      }
      featuredImage = await uploadToCloudinary(req.file);
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        excerpt,
        readingTime,
        featuredImage,
        author: author ? JSON.parse(author) : blog.author,
        tags: tags ? JSON.parse(tags) : blog.tags,
        category,
        seo: seo ? JSON.parse(seo) : blog.seo,
        isPublished: isPublished === 'true',
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      blog: updatedBlog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Delete image from cloudinary
    if (blog.featuredImage?.publicId) {
      await cloudinary.uploader.destroy(blog.featuredImage.publicId);
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle publish status
// @route   PATCH /api/blogs/:id/toggle-publish
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    res.json({
      success: true,
      blog,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};