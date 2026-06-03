const Blog = require('../models/Blog');
const path = require('path');
const fs = require('fs');

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, '').trim();

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') return defaultValue;
  if (typeof value === 'boolean') return value;
  return String(value).toLowerCase() === 'true';
};

const parseTags = (tags) => {
  if (!tags) return [];

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  try {
    const parsedTags = JSON.parse(tags);
    if (Array.isArray(parsedTags)) {
      return parsedTags.map((tag) => String(tag).trim()).filter(Boolean);
    }
  } catch (error) {
    // Fall through to comma-separated split below
  }

  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const calculateReadingTime = (content = '') => {
  const text = stripHtml(content);
  if (!text) return 1;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / 200));
};

// ✅ Returns the stored image path.
// If multer saved to disk, req.file.filename is present → /uploads/blogs/<filename>
// If using cloud storage (e.g. Cloudinary), req.file.path is the full https:// URL
const getUploadedImagePath = (file) => {
  if (!file) return '';

  // Cloud storage: file.path is already a full URL
  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }

  // Disk storage: file.filename is the saved filename
  if (file.filename) {
    return `/uploads/blogs/${file.filename}`;
  }

  return file.path || '';
};

const deleteLocalImage = (imagePath) => {
  // Skip deletion for cloud/absolute URLs
  if (!imagePath || /^https?:\/\//i.test(imagePath)) return;

  const normalizedPath = imagePath.replace(/^\/+/, '');
  const absolutePath = path.join(__dirname, '..', normalizedPath);

  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      console.error('Failed to delete image file:', err.message);
    }
  }
};

const getErrorMessage = (error) => {
  if (error.name === 'ValidationError') {
    return Object.values(error.errors)
      .map((item) => item.message)
      .join(', ');
  }
  return error.message || 'Server error';
};

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      author,
      authorImage,
      tags,
      category,
      isPublished,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    if (!stripHtml(content)) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // ✅ req.file is populated by multer.single('featuredImage') in the route
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Featured image is required' });
    }

    const blog = await Blog.create({
      title: title.trim(),
      content,
      excerpt: excerpt?.trim(),
      featuredImage: getUploadedImagePath(req.file),
      author: author?.trim() || 'Admin',
      authorImage: authorImage || null,
      readingTime: calculateReadingTime(content),
      tags: parseTags(tags),
      category: category || 'General',
      isPublished: parseBoolean(isPublished, true),
      isFeatured: parseBoolean(isFeatured, false),
      metaTitle: metaTitle?.trim(),
      metaDescription: metaDescription?.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};

// ---------------------------------------------------------------------------
// GET ALL (public — paginated, filtered)
// ---------------------------------------------------------------------------
exports.getAllBlogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, tag, search } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const query = { isPublished: true };

    if (category && category !== 'all') {
      query.category = category;
    }

    if (tag) {
      query.tags = tag;
    }

    if (search?.trim()) {
      query.$text = { $search: search.trim() };
    }

    const [blogs, total] = await Promise.all([
      Blog.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Blog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: blogs,
      totalPages: Math.ceil(total / parsedLimit),
      currentPage: parsedPage,
      total,
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};

// ---------------------------------------------------------------------------
// GET BY ID (public — increments views)
// ---------------------------------------------------------------------------
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    blog.views += 1;
    await blog.save();

    const relatedPosts = await Blog.find({
      _id: { $ne: blog._id },
      isPublished: true,
      $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
    })
      .limit(3)
      .select('title featuredImage publishedAt readingTime');

    return res.json({
      success: true,
      data: blog,
      relatedPosts,
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};

// ---------------------------------------------------------------------------
// GET ALL (admin — no pagination, all statuses)
// ---------------------------------------------------------------------------
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: blogs });
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------
exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    const {
      title,
      content,
      excerpt,
      author,
      authorImage,
      tags,
      category,
      isPublished,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    if (title !== undefined) blog.title = title.trim();
    if (content !== undefined) blog.content = content;
    if (excerpt !== undefined) blog.excerpt = excerpt.trim();
    if (author !== undefined) blog.author = author.trim() || 'Admin';
    if (authorImage !== undefined) blog.authorImage = authorImage || null;
    if (tags !== undefined) blog.tags = parseTags(tags);
    if (category !== undefined) blog.category = category || 'General';
    if (isPublished !== undefined) blog.isPublished = parseBoolean(isPublished, blog.isPublished);
    if (isFeatured !== undefined) blog.isFeatured = parseBoolean(isFeatured, blog.isFeatured);
    if (metaTitle !== undefined) blog.metaTitle = metaTitle.trim();
    if (metaDescription !== undefined) blog.metaDescription = metaDescription.trim();

    if (!stripHtml(blog.content)) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // Only replace image if a new file was uploaded
    if (req.file) {
      deleteLocalImage(blog.featuredImage);
      blog.featuredImage = getUploadedImagePath(req.file);
    }

    blog.readingTime = calculateReadingTime(blog.content);
    await blog.save();

    return res.json({
      success: true,
      message: 'Blog post updated successfully',
      data: blog,
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};

// ---------------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------------
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    deleteLocalImage(blog.featuredImage);
    await blog.deleteOne();

    return res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};

// ---------------------------------------------------------------------------
// TOGGLE PUBLISH
// ---------------------------------------------------------------------------
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, error: 'Blog post not found' });
    }

    blog.isPublished = !blog.isPublished;
    await blog.save();

    return res.json({
      success: true,
      message: `Blog ${blog.isPublished ? 'published' : 'unpublished'} successfully`,
      data: blog,
    });
  } catch (error) {
    console.error('Error toggling blog publish status:', error);
    return res.status(500).json({ success: false, error: getErrorMessage(error) });
  }
};