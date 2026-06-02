const Blog = require('../models/Blog');
const cloudinary = require('../config/cloudinary');

// Helper function to upload image to cloudinary
const uploadToCloudinary = async (file) => {
  try {
<<<<<<< HEAD
=======
    if (!file || !file.path) {
      return null;
    }
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
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
<<<<<<< HEAD
    throw error;
=======
    return null;
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
  }
};

// @desc    Get all published blogs (public)
// @route   GET /api/blogs
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag } = req.query;
    const query = { isPublished: true };

<<<<<<< HEAD
    if (category) query.category = category;
=======
    if (category && category !== 'all') query.category = category;
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
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
    console.error('Error in getAllBlogs:', error);
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
    console.error('Error in getBlogBySlug:', error);
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
    console.error('Error in getAllBlogsAdmin:', error);
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
<<<<<<< HEAD
=======
    console.error('Error in getBlogById:', error);
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
exports.createBlog = async (req, res) => {
  try {
<<<<<<< HEAD
    const { title, content, excerpt, author, tags, category, seo, isPublished } = req.body;

    // Calculate reading time (average reading speed: 200 words per minute)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
=======
    console.log('Creating blog with data:', req.body);
    console.log('File received:', req.file);

    const { title, content, excerpt, author, tags, category, seo, isPublished } = req.body;

    // Validate required fields
    if (!title || !content || !excerpt) {
      return res.status(400).json({ error: 'Title, content, and excerpt are required' });
    }

    // Calculate reading time (average reading speed: 200 words per minute)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549

    let featuredImage = null;
    if (req.file) {
      featuredImage = await uploadToCloudinary(req.file);
    }

<<<<<<< HEAD
=======
    // Parse tags and author if they are strings
    let parsedTags = [];
    let parsedAuthor = { name: 'Shardul Jadhavar' };
    let parsedSeo = {};
    let parsedCategory = category || 'General';

    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim());
      }
    }

    if (author) {
      try {
        parsedAuthor = typeof author === 'string' ? JSON.parse(author) : author;
      } catch (e) {
        parsedAuthor = { name: author };
      }
    }

    if (seo) {
      try {
        parsedSeo = typeof seo === 'string' ? JSON.parse(seo) : seo;
      } catch (e) {
        parsedSeo = {};
      }
    }

>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
    const blog = await Blog.create({
      title,
      content,
      excerpt,
      readingTime,
      featuredImage,
<<<<<<< HEAD
      author: author || { name: 'Shardul Jadhavar' },
      tags: tags ? JSON.parse(tags) : [],
      category,
      seo: seo ? JSON.parse(seo) : {},
      isPublished: isPublished === 'true',
    });

=======
      author: parsedAuthor,
      tags: parsedTags,
      category: parsedCategory,
      seo: parsedSeo,
      isPublished: isPublished === 'true' || isPublished === true,
    });

    console.log('Blog created successfully:', blog._id);

>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
    res.status(201).json({
      success: true,
      blog,
    });
  } catch (error) {
<<<<<<< HEAD
    res.status(500).json({ error: error.message });
=======
    console.error('Error in createBlog:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
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
<<<<<<< HEAD
      readingTime = Math.ceil(wordCount / 200);
=======
      readingTime = Math.max(1, Math.ceil(wordCount / 200));
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
    }

    let featuredImage = blog.featuredImage;
    if (req.file) {
      // Delete old image from cloudinary if exists
      if (blog.featuredImage?.publicId) {
<<<<<<< HEAD
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
=======
        try {
          await cloudinary.uploader.destroy(blog.featuredImage.publicId);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
      }
      featuredImage = await uploadToCloudinary(req.file);
    }

<<<<<<< HEAD
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

=======
    // Parse data
    let parsedTags = blog.tags;
    let parsedAuthor = blog.author;
    let parsedSeo = blog.seo;

    if (tags) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = tags.split(',').map(t => t.trim());
      }
    }

    if (author) {
      try {
        parsedAuthor = typeof author === 'string' ? JSON.parse(author) : author;
      } catch (e) {
        parsedAuthor = { name: author };
      }
    }

    if (seo) {
      try {
        parsedSeo = typeof seo === 'string' ? JSON.parse(seo) : seo;
      } catch (e) {
        parsedSeo = {};
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title: title || blog.title,
        content: content || blog.content,
        excerpt: excerpt || blog.excerpt,
        readingTime,
        featuredImage,
        author: parsedAuthor,
        tags: parsedTags,
        category: category || blog.category,
        seo: parsedSeo,
        isPublished: isPublished === 'true' || isPublished === true,
      },
      { new: true, runValidators: true }
    );

>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
    res.json({
      success: true,
      blog: updatedBlog,
    });
  } catch (error) {
    console.error('Error in updateBlog:', error);
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
<<<<<<< HEAD
      await cloudinary.uploader.destroy(blog.featuredImage.publicId);
=======
      try {
        await cloudinary.uploader.destroy(blog.featuredImage.publicId);
      } catch (err) {
        console.error('Error deleting image from cloudinary:', err);
      }
>>>>>>> 78893022d6d92916ba0e87ab86b32c0c25dd1549
    }

    await blog.deleteOne();

    res.json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
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
    console.error('Error in togglePublish:', error);
    res.status(500).json({ error: error.message });
  }
};
