// Approve issuer user
import mongoose from 'mongoose';

// User schema
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

async function approveIssuer() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb+srv://jyothiakkina7_db_user:8BGDIWXkkjSxPSmi@cluster0.dmjn2h8.mongodb.net/cert_verify?retryWrites=true&w=majority';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find and approve issuer users
    const issuerUsers = await User.find({ role: 'issuer' });
    console.log(`Found ${issuerUsers.length} issuer users:`);
    
    for (const user of issuerUsers) {
      console.log(`- ${user.email} (${user.name}) - Status: ${user.approvalStatus}`);
      
      if (user.approvalStatus !== 'approved') {
        user.approvalStatus = 'approved';
        await user.save();
        console.log(`✅ Approved ${user.email}`);
      } else {
        console.log(`✅ ${user.email} already approved`);
      }
    }

    console.log('\n🎉 All issuer users approved!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

approveIssuer();


