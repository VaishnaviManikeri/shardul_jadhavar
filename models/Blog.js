const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    content: { type: String, required: true },
    image: { type: String },
    author: { type: String, default: 'Admin' },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Generate slug automatically
blogSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);