const mongoose = require('mongoose');
const Video = require('./models/Video');
require('dotenv').config();

async function testVideoAPI() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Count total videos
    const totalVideos = await Video.countDocuments();
    console.log(`Total videos in database: ${totalVideos}`);
    
    // Count published videos
    const publishedVideos = await Video.countDocuments({ isPublished: true });
    console.log(`Published videos: ${publishedVideos}`);
    
    // Get a few sample videos
    const sampleVideos = await Video.find({ isPublished: true }).limit(5);
    console.log('\nSample published videos:');
    sampleVideos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title} - Published: ${video.isPublished}`);
    });
    
    // Check if any videos are not published
    const unpublishedVideos = await Video.find({ isPublished: false });
    console.log(`\nUnpublished videos: ${unpublishedVideos.length}`);
    
    await mongoose.disconnect();
    console.log('\nTest completed');
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testVideoAPI();