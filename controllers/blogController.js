const Blog = require('../models/Blog');

// 🔥 Generate Clean Slug
const generateSlug = (title) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');

// 🔥 Generate Unique Slug
const generateUniqueSlug = async (title) => {
  let slug = generateSlug(title);
  let existing = await Blog.findOne({ slug });

  let counter = 1;

  while (existing) {
    slug = `${generateSlug(title)}-${counter}`;
    existing = await Blog.findOne({ slug });
    counter++;
  }

  return slug;
};

// ================= CREATE BLOG =================
exports.createBlog = async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const slug = await generateUniqueSlug(title);

    const blog = new Blog({
      title,
      slug,
      content,
      author,
      image: req.file ? req.file.filename : '',
    });

    await blog.save();

    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= GET ALL (PUBLIC) =================
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true }).sort({
      createdAt: -1,
    });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= GET ALL (ADMIN) =================
exports.getAllBlogsAdmin = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= UPDATE BLOG =================
exports.updateBlog = async (req, res) => {
  try {
    const { title, content, author } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // If title changed → regenerate slug
    if (title && title !== blog.title) {
      blog.slug = await generateUniqueSlug(title);
    }

    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.author = author || blog.author;

    if (req.file) {
      blog.image = req.file.filename;
    }

    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= DELETE BLOG =================
exports.deleteBlog = async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= TOGGLE PUBLISH =================
exports.togglePublish = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    blog.isPublished = !blog.isPublished;

    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};