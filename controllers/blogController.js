const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

// Helper function to calculate reading time
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return Math.max(1, minutes);
};

// Helper function to generate excerpt from HTML content
const generateExcerpt = (content, maxLength = 300) => {
  const text = content.replace(/<[^>]*>/g, '').trim();
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Get all blogs (public)
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search } = req.query;
    const query = { isPublished: true };

    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

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
      total
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
};

// Get featured blogs
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true, isFeatured: true })
      .sort({ publishedAt: -1 })
      .limit(3);
    res.json({ success: true, blogs });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({ error: 'Failed to fetch featured blogs' });
  }
};

// Get blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug, isPublished: true });
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment views
    blog.views += 1;
    await blog.save();
    
    res.json({ success: true, blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// Get blog by ID (admin)
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ success: true, blog });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
};

// Create blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, tags, category, isPublished, isFeatured, metaTitle, metaDescription } = req.body;
    
    // Calculate reading time
    const readingTime = calculateReadingTime(content);
    
    // Generate excerpt
    const excerpt = generateExcerpt(content);
    
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
    }
    
    const blog = new Blog({
      title,
      slug: title.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-'),
      content,
      excerpt,
      featuredImage,
      author: {
        name: req.user?.username || 'Admin'
      },
      readingTime,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      category: category || 'General',
      isPublished: isPublished === 'true',
      isFeatured: isFeatured === 'true',
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt
    });
    
    await blog.save();
    res.status(201).json({ success: true, blog });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ error: 'Failed to create blog' });
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    const { title, content, tags, category, isPublished, isFeatured, metaTitle, metaDescription } = req.body;
    
    let featuredImage = blog.featuredImage;
    if (req.file) {
      // Delete old image from cloudinary
      if (blog.featuredImage?.publicId) {
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      }
      
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'blogs',
        transformation: [{ width: 1200, height: 630, crop: 'fill' }]
      });
      featuredImage = {
        url: result.secure_url,
        publicId: result.public_id,
        alt: title
      };
    }
    
    // Update fields
    blog.title = title || blog.title;
    blog.slug = title ? title.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-') : blog.slug;
    blog.content = content || blog.content;
    blog.excerpt = content ? generateExcerpt(content) : blog.excerpt;
    blog.featuredImage = featuredImage;
    blog.readingTime = content ? calculateReadingTime(content) : blog.readingTime;
    blog.tags = tags ? tags.split(',').map(t => t.trim()) : blog.tags;
    blog.category = category || blog.category;
    blog.isPublished = isPublished === 'true';
    blog.isFeatured = isFeatured === 'true';
    blog.metaTitle = metaTitle || blog.metaTitle;
    blog.metaDescription = metaDescription || blog.metaDescription;
    
    await blog.save();
    res.json({ success: true, blog });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({ error: 'Failed to update blog' });
  }
};

// Delete blog
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
    res.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({ error: 'Failed to delete blog' });
  }
};

// Toggle publish status
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    blog.isPublished = !blog.isPublished;
    await blog.save();
    res.json({ success: true, isPublished: blog.isPublished });
  } catch (error) {
    console.error('Error toggling publish:', error);
    res.status(500).json({ error: 'Failed to toggle publish status' });
  }
};

// Toggle featured status
exports.toggleFeatured = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    blog.isFeatured = !blog.isFeatured;
    await blog.save();
    res.json({ success: true, isFeatured: blog.isFeatured });
  } catch (error) {
    console.error('Error toggling featured:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
};
