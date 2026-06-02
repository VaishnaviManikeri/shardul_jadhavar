const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

// Helper function to calculate reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
};

// Generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private (Admin)
exports.createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, authorName, tags, category, metaTitle, metaDescription, seoKeywords } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Generate unique slug
    let slug = generateSlug(title);
    let existingBlog = await Blog.findOne({ slug });
    let counter = 1;
    while (existingBlog) {
      slug = `${generateSlug(title)}-${counter}`;
      existingBlog = await Blog.findOne({ slug });
      counter++;
    }

    // Calculate reading time
    const readingTime = calculateReadingTime(content);

    // Handle featured image
    let featuredImage = null;
    if (req.file) {
      featuredImage = {
        url: req.file.path,
        publicId: req.file.filename,
        alt: title
      };
    }

    // Parse tags and keywords if they are strings
    let parsedTags = [];
    let parsedSeoKeywords = [];
    
    try {
      if (tags) {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      }
      if (seoKeywords) {
        parsedSeoKeywords = typeof seoKeywords === 'string' ? JSON.parse(seoKeywords) : seoKeywords;
      }
    } catch (e) {
      console.error('Error parsing tags/seoKeywords:', e);
    }

    const blog = new Blog({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 300).replace(/<[^>]*>/g, ''),
      featuredImage,
      author: {
        name: authorName || 'Admin'
      },
      readingTime,
      tags: parsedTags,
      category: category || 'General',
      isPublished: true,
      publishedAt: new Date(),
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || content.substring(0, 160).replace(/<[^>]*>/g, ''),
      seoKeywords: parsedSeoKeywords
    });

    await blog.save();

    res.status(201).json({
      success: true,
      data: blog
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
    const { page = 1, limit = 10, category, tag } = req.query;
    
    const query = { isPublished: true };
    
    if (category) query.category = category;
    if (tag) query.tags = tag;
    
    const blogs = await Blog.find(query)
      .sort({ publishedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-content');
    
    const total = await Blog.countDocuments(query);
    
    res.json({
      success: true,
      data: blogs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/blogs/admin/all
// @access  Private (Admin)
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment view count
    blog.views += 1;
    await blog.save();
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single blog by ID (admin)
// @route   GET /api/blogs/admin/:id
// @access  Private (Admin)
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Admin)
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, excerpt, authorName, tags, category, isPublished, metaTitle, metaDescription, seoKeywords } = req.body;
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Update fields
    if (title) {
      blog.title = title;
      let slug = generateSlug(title);
      const existingBlog = await Blog.findOne({ slug, _id: { $ne: blog._id } });
      if (!existingBlog) {
        blog.slug = slug;
      }
    }
    
    if (content) {
      blog.content = content;
      blog.readingTime = calculateReadingTime(content);
    }
    
    if (excerpt) blog.excerpt = excerpt;
    if (authorName) blog.author.name = authorName;
    
    // Parse tags
    if (tags) {
      try {
        blog.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        blog.tags = [];
      }
    }
    
    if (category) blog.category = category;
    if (isPublished !== undefined) blog.isPublished = isPublished;
    if (metaTitle) blog.metaTitle = metaTitle;
    if (metaDescription) blog.metaDescription = metaDescription;
    
    // Parse seo keywords
    if (seoKeywords) {
      try {
        blog.seoKeywords = typeof seoKeywords === 'string' ? JSON.parse(seoKeywords) : seoKeywords;
      } catch (e) {
        blog.seoKeywords = [];
      }
    }
    
    // Update featured image if provided
    if (req.file) {
      // Delete old image from cloudinary
      if (blog.featuredImage && blog.featuredImage.publicId) {
        try {
          await cloudinary.uploader.destroy(blog.featuredImage.publicId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      
      blog.featuredImage = {
        url: req.file.path,
        publicId: req.file.filename,
        alt: title || blog.title
      };
    }
    
    await blog.save();
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin)
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Delete image from cloudinary
    if (blog.featuredImage && blog.featuredImage.publicId) {
      try {
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    await blog.deleteOne();
    
    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private (Admin)
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
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get blog categories
// @route   GET /api/blogs/categories/all
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct('category', { isPublished: true });
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
};
