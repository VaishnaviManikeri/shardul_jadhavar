const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  metaTitle: {
    type: String,
    required: [true, 'Meta title is required for SEO'],
  },
  metaDescription: {
    type: String,
    required: [true, 'Meta description is required for SEO'],
  },
  author: {
    type: String,
    required: true,
    default: 'Admin',
  },
  authorImage: {
    type: String,
    default: '',
  },
  featuredImage: {
    type: String,
    required: [true, 'Featured image is required'],
  },
  featuredImagePublicId: {
    type: String,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  readingTime: {
    type: Number,
    default: 5,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  isPublished: {
    type: Boolean,
    default: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  seoKeywords: [{
    type: String,
  }],
}, {
  timestamps: true,
});

// Create slug from title before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
