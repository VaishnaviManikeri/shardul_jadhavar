const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');

// Get all published videos (public)
// Get all published videos (public) - FIXED VERSION
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, featured, search } = req.query;
    
    // IMPORTANT: Only show published videos to public
    const query = { isPublished: true };
    
    if (category && category !== 'all') query.category = category;
    if (featured === 'true') query.featured = true;
    
    // Add search functionality for public
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'username email');
    
    const total = await Video.countDocuments(query);
    
    res.json({
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single video by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'username email');
    
    if (!video || !video.isPublished) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Increment view count
    video.views += 1;
    await video.save();
    
    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ================= ADMIN ROUTES =================
// Get all videos (admin - including unpublished)
router.get('/admin/all', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, isPublished, search } = req.query;
    
    let query = {};
    
    if (category) query.category = category;
    if (isPublished) query.isPublished = isPublished === 'true';
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const videos = await Video.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'username email');
    
    const total = await Video.countDocuments(query);
    
    res.json({
      videos,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching admin videos:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create video (admin)
router.post('/', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, videoUrl, category, tags, isPublished, featured } = req.body;
    
    let thumbnailUrl = '';
    if (req.file) {
      thumbnailUrl = req.file.path;
    }
    
    // Parse tags if it's a string
    let tagArray = [];
    if (tags) {
      tagArray = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
    }
    
    const video = new Video({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category: category || 'other',
      tags: tagArray,
      isPublished: isPublished !== 'false',
      featured: featured === 'true',
      uploadedBy: req.user.id
    });
    
    await video.save();
    
    const populatedVideo = await Video.findById(video._id)
      .populate('uploadedBy', 'username email');
    
    res.status(201).json(populatedVideo);
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update video (admin)
router.put('/:id', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, videoUrl, category, tags, isPublished, featured } = req.body;
    
    let updateData = {
      title,
      description,
      videoUrl,
      category,
      isPublished: isPublished !== 'false',
      featured: featured === 'true'
    };
    
    // Parse tags if provided
    if (tags) {
      updateData.tags = typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags;
    }
    
    // Handle thumbnail update
    if (req.file) {
      updateData.thumbnailUrl = req.file.path;
      
      // Delete old thumbnail from Cloudinary if exists
      const existingVideo = await Video.findById(req.params.id);
      if (existingVideo && existingVideo.thumbnailUrl) {
        try {
          const publicId = existingVideo.thumbnailUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`uploads/${publicId}`);
        } catch (cloudinaryError) {
          console.error('Error deleting old thumbnail:', cloudinaryError);
        }
      }
    }
    
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'username email');
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete video (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Delete thumbnail from Cloudinary if exists
    if (video.thumbnailUrl) {
      try {
        const publicId = video.thumbnailUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`uploads/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting thumbnail:', cloudinaryError);
      }
    }
    
    await video.deleteOne();
    
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle publish status (admin)
router.patch('/:id/toggle-publish', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    video.isPublished = !video.isPublished;
    await video.save();
    
    res.json(video);
  } catch (error) {
    console.error('Error toggling publish status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle featured status (admin)
router.patch('/:id/toggle-featured', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    video.featured = !video.featured;
    await video.save();
    
    res.json(video);
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;