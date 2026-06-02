const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

// Calculate reading time (approx 200 words per minute)
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readingTime);
};

// Generate excerpt from content
const generateExcerpt = (content, maxLength = 500) => {
  const text = content.replace(/<[^>]*>/g, '');
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// @desc    Create a new blog
// @route   POST /api/blogs
// @access  Private
const createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      authorName,
      tags,
      category,
      seoMetaTitle,
      seoMetaDescription,
      seoKeywords
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Check if slug already exists
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({ error: 'A blog with similar title already exists' });
    }

    let featuredImage = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blogs',
        transformation: [{ width: 1200, height: 630, crop: 'fill' }]
      });
      featuredImage = {
        url: result.secure_url,
        publicId: result.public_id,
        alt: title
      };
    } else {
      return res.status(400).json({ error: 'Featured image is required' });
    }

    const readingTime = calculateReadingTime(content);
    const excerpt = generateExcerpt(content);

    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      author: {
        name: authorName || 'Admin'
      },
      readingTime,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      category: category || 'General',
      seo: {
        metaTitle: seoMetaTitle || title,
        metaDescription: seoMetaDescription || excerpt,
        keywords: seoKeywords ? (Array.isArray(seoKeywords) ? seoKeywords : seoKeywords.split(',').map(k => k.trim())) : []
      }
    });

    await blog.save();

    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({ error: error.message || 'Failed to create blog' });
  }
};

// @desc    Get all published blogs
// @route   GET /api/blogs
// @access  Public
const getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    
    let query = { isPublished: true };
    
    if (category) {
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
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// @desc    Get single blog by slug
// @route   GET /api/blogs/:slug
// @access  Public
const getBlogBySlug = async (req, res) => {
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
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// @desc    Get all blogs for admin
// @route   GET /api/blogs/admin/all
// @access  Private
const getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .select('-content');
    
    res.json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    const {
      title,
      content,
      authorName,
      tags,
      category,
      seoMetaTitle,
      seoMetaDescription,
      seoKeywords,
      isPublished
    } = req.body;

    if (title && title !== blog.title) {
      const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: req.params.id } });
      if (!existingBlog) {
        blog.slug = newSlug;
      }
      blog.title = title;
    }

    if (content) {
      blog.content = content;
      blog.readingTime = calculateReadingTime(content);
      blog.excerpt = generateExcerpt(content);
    }

    if (req.file) {
      // Delete old image from cloudinary
      if (blog.featuredImage && blog.featuredImage.publicId) {
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      }
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blogs',
        transformation: [{ width: 1200, height: 630, crop: 'fill' }]
      });
      
      blog.featuredImage = {
        url: result.secure_url,
        publicId: result.public_id,
        alt: title || blog.title
      };
    }

    if (authorName) blog.author.name = authorName;
    if (tags) blog.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim());
    if (category) blog.category = category;
    if (isPublished !== undefined) blog.isPublished = isPublished === 'true' || isPublished === true;
    
    if (seoMetaTitle || seoMetaDescription || seoKeywords) {
      blog.seo = {
        metaTitle: seoMetaTitle || blog.seo?.metaTitle || blog.title,
        metaDescription: seoMetaDescription || blog.seo?.metaDescription || blog.excerpt,
        keywords: seoKeywords ? (Array.isArray(seoKeywords) ? seoKeywords : seoKeywords.split(',').map(k => k.trim())) : blog.seo?.keywords || []
      };
    }

    await blog.save();

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Delete image from cloudinary
    if (blog.featuredImage && blog.featuredImage.publicId) {
      await cloudinary.uploader.destroy(blog.featuredImage.publicId);
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/blogs/:id/toggle-publish
// @access  Private
const togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
  togglePublish,
  getAdminBlogs
};
