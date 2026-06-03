const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema({
  position: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  requirements: [{
    type: String,
    required: true
  }],
  responsibilities: [{
    type: String,
    required: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  applicationDeadline: {
    type: Date,
    required: true
  },
  salaryRange: {
    min: { type: Number },
    max: { type: Number }
  },
  experienceRequired: {
    type: String,
    trim: true
  }
}, {
  timestamps: true   // ✅ AUTO handles createdAt & updatedAt
});

// ❌ REMOVE THIS BLOCK COMPLETELY

module.exports = mongoose.model('Career', careerSchema);
