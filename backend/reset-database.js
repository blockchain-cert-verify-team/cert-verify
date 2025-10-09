import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'issuer', 'verifier'], default: 'verifier' },
  organization: { type: String },
  approvalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  accessRequestedAt: { type: Date },
  lastLoginAt: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const certificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  recipientName: { type: String, required: true },
  recipientEmail: { type: String },
  courseName: { type: String, required: true },
  issuedOn: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  ipfsHash: { type: String },
  studentHash: { type: String },
  qrCode: { type: String },
  issuer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isRevoked: { type: Boolean, default: false },
  revokedAt: { type: Date },
  revokedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);

async function resetDatabase() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all users
    console.log('\n=== CLEARING USERS ===');
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users`);
    
    if (userCount > 0) {
      await User.deleteMany({});
      console.log('✅ All users deleted');
    } else {
      console.log('No users to delete');
    }

    // Clear all certificates
    console.log('\n=== CLEARING CERTIFICATES ===');
    const certCount = await Certificate.countDocuments();
    console.log(`Found ${certCount} certificates`);
    
    if (certCount > 0) {
      await Certificate.deleteMany({});
      console.log('✅ All certificates deleted');
    } else {
      console.log('No certificates to delete');
    }

    // Create a fresh admin user
    console.log('\n=== CREATING ADMIN USER ===');
    const bcrypt = await import('bcryptjs');
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      passwordHash: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      organization: 'CertChain System',
      approvalStatus: 'none',
      isActive: true
    });
    console.log('✅ Admin user created:', adminUser.email);

    console.log('\n=== DATABASE RESET COMPLETE ===');
    console.log('✅ All users and certificates cleared');
    console.log('✅ Fresh admin user created');
    console.log('\nAdmin credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error resetting database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

resetDatabase();
