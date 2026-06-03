const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  featuredImage: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: 'Admin'
  },
  readingTime: {
    type: Number,
    default: 5
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta title cannot exceed 160 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [320, 'Meta description cannot exceed 320 characters']
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for search
blogSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Blog', blogSchema);