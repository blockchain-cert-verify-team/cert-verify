import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

const User = mongoose.model('User', userSchema);

async function testSignupLogin() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Test signup
    const testEmail = 'testissuer@example.com';
    const testPassword = 'password123';
    
    // Clean up any existing test user
    await User.deleteOne({ email: testEmail });
    console.log('Cleaned up existing test user');

    // Simulate signup
    console.log('\n=== TESTING SIGNUP ===');
    const passwordHash = await bcrypt.hash(testPassword, 12);
    const user = await User.create({
      name: 'Test Issuer',
      email: testEmail,
      passwordHash,
      role: 'issuer',
      organization: 'Test Organization',
      approvalStatus: 'pending',
      accessRequestedAt: new Date(),
      isActive: true
    });
    console.log('User created:', {
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      isActive: user.isActive
    });

    // Test login
    console.log('\n=== TESTING LOGIN ===');
    const foundUser = await User.findOne({ email: testEmail });
    console.log('Found user:', foundUser ? 'YES' : 'NO');
    
    if (foundUser) {
      const passwordMatch = await foundUser.comparePassword(testPassword);
      console.log('Password match:', passwordMatch ? 'YES' : 'NO');
      console.log('User details:', {
        email: foundUser.email,
        role: foundUser.role,
        approvalStatus: foundUser.approvalStatus,
        isActive: foundUser.isActive
      });
    }

    // Clean up
    await User.deleteOne({ email: testEmail });
    console.log('\nTest user cleaned up');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
}

testSignupLogin();
