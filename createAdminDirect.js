const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdminDirect() {
  console.log('🔧 Creating admin directly...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb+srv://shardul:shardul123@cluster0.dvhphea.mongodb.net/?appName=Cluster0'
    );
    console.log('✅ Connected to MongoDB');
    
    // Define Admin schema
    const adminSchema = new mongoose.Schema({
      username: String,
      email: { type: String, unique: true },
      password: String,
      role: String,
      createdAt: { type: Date, default: Date.now }
    });
    
    const Admin = mongoose.model('Admin', adminSchema);
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('✅ Admin already exists:');
      console.log(`   ID: ${existingAdmin._id}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Role: ${existingAdmin.role}`);
      return;
    }
    
    // Create admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = new Admin({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'superadmin'
    });
    
    await admin.save();
    
    console.log('✅ Admin created successfully!');
    console.log('📋 Credentials:');
    console.log(`   ID: ${admin._id}`);
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: superadmin');
    
    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    console.log('\n🔑 JWT Token:');
    console.log(token);
    
    console.log('\n📝 Use this token in Postman:');
    console.log('Authorization: Bearer ' + token);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createAdminDirect();