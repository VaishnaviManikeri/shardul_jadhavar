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
  excerpt: {
    type: String,
    maxlength: [300, 'Excerpt cannot exceed 300 characters']
  },
  featuredImage: {
    type: String,
    required: [true, 'Featured image is required']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    default: 'Admin'
  },
  authorImage: {
    type: String,
    default: null
  },
  readingTime: {
    type: Number,
    default: 5
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    default: 'General'
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  metaTitle: {
    type: String,
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create index for search
blogSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Generate excerpt from content if not provided
blogSchema.pre('save', function() {
  if (!this.excerpt && this.content) {
    // Remove HTML tags and get plain text
    const plainText = this.content.replace(/<[^>]*>/g, '');
    this.excerpt = plainText.substring(0, 250) + (plainText.length > 250 ? '...' : '');
  }
  
  // Generate meta title if not provided
  if (!this.metaTitle) {
    this.metaTitle = this.title;
  }
  
  // Generate meta description if not provided
  if (!this.metaDescription && this.excerpt) {
    this.metaDescription = this.excerpt.substring(0, 160);
  }
});

module.exports = mongoose.model('Blog', blogSchema);
