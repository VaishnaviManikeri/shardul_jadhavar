const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  excerpt: {
    type: String,
    required: [true, 'Excerpt is required'],
    maxlength: 200,
  },
  featuredImage: {
    url: String,
    publicId: String,
  },
  author: {
    name: {
      type: String,
      default: 'Admin',
    },
    avatar: String,
  },
  readingTime: {
    type: Number,
    default: 5,
  },
  tags: [String],
  category: {
    type: String,
    default: 'General',
  },
  isPublished: {
    type: Boolean,
    default: true,
  },
  views: {
    type: Number,
    default: 0,
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update slug before saving
blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);