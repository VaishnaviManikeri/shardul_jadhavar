const Blog = require('../models/Blog');

/*
|--------------------------------------------------------------------------
| CREATE BLOG
|--------------------------------------------------------------------------
| POST /api/blogs
|--------------------------------------------------------------------------
*/
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    const blog = new Blog({
      title,
      content,
      author: author || 'Admin',
      isPublished: isPublished ?? true,
      image: req.file ? `/uploads/blogs/${req.file.filename}` : '',
    });

    await blog.save();

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      blog,
    });
  } catch (error) {
    console.error('Create Blog Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL BLOGS (PUBLIC)
|--------------------------------------------------------------------------
| GET /api/blogs
|--------------------------------------------------------------------------
*/
exports.getBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Get Blogs Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET ALL BLOGS (ADMIN)
|--------------------------------------------------------------------------
| GET /api/blogs/admin/all
|--------------------------------------------------------------------------
*/
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select('-__v');

    res.status(200).json(blogs);
  } catch (error) {
    console.error('Admin Get Blogs Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs (admin)',
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET SINGLE BLOG BY ID
|--------------------------------------------------------------------------
| GET /api/blogs/:id
|--------------------------------------------------------------------------
*/
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Get Blog By ID Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
    });
  }
};

/*
|--------------------------------------------------------------------------
| GET BLOG BY SLUG (Professional URL)
|--------------------------------------------------------------------------
| GET /api/blogs/slug/:slug
|--------------------------------------------------------------------------
*/
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      isPublished: true,
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error('Get Blog By Slug Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog by slug',
    });
  }
};

/*
|--------------------------------------------------------------------------
| UPDATE BLOG
|--------------------------------------------------------------------------
| PUT /api/blogs/:id
|--------------------------------------------------------------------------
*/
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, author, isPublished } = req.body;

    const updateData = {
      title,
      content,
      author,
      isPublished,
    };

    // If new image uploaded
    if (req.file) {
      updateData.image = `/uploads/blogs/${req.file.filename}`;
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      blog,
    });
  } catch (error) {
    console.error('Update Blog Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
    });
  }
};

/*
|--------------------------------------------------------------------------
| DELETE BLOG
|--------------------------------------------------------------------------
| DELETE /api/blogs/:id
|--------------------------------------------------------------------------
*/
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully',
    });
  } catch (error) {
    console.error('Delete Blog Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
    });
  }
};