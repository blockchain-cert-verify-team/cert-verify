import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const USER_ROLES = {
  ADMIN: 'admin',
  ISSUER: 'issuer',
  VERIFIER: 'verifier'
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { 
      type: String, 
      enum: Object.values(USER_ROLES), 
      default: USER_ROLES.VERIFIER 
    },
    organization: { type: String },
    approvalStatus: { 
      type: String, 
      enum: ['none', 'pending', 'approved', 'rejected'], 
      default: 'none' 
    },
    accessRequestedAt: { type: Date },
    lastLoginAt: { type: Date },
    isActive: { type: Boolean, default: true }
  },
  { 
    timestamps: true,
    toJSON: { 
      transform: function(doc, ret) {
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

// Index for faster queries (email is already unique, so no need to index again)
userSchema.index({ role: 1 });
userSchema.index({ approvalStatus: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to hash password
userSchema.statics.hashPassword = async function(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

// Instance method to compare password
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Instance method to check if user is approved
userSchema.methods.isApproved = function() {
  return this.approvalStatus === 'approved' || this.role === USER_ROLES.ADMIN;
};

// Instance method to check if user can issue certificates
userSchema.methods.canIssue = function() {
  return (this.role === USER_ROLES.ADMIN) || 
         (this.role === USER_ROLES.ISSUER && this.isApproved());
};

// Instance method to check if user can verify certificates
userSchema.methods.canVerify = function() {
  return this.role === USER_ROLES.VERIFIER || 
         this.role === USER_ROLES.ISSUER || 
         this.role === USER_ROLES.ADMIN;
};

// Virtual for user's full display name
userSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.organization || 'No Organization'})`;
});

// Virtual for user's status
userSchema.virtual('status').get(function() {
  if (this.role === USER_ROLES.ADMIN) return 'Admin';
  if (this.role === USER_ROLES.ISSUER) {
    switch (this.approvalStatus) {
      case 'approved': return 'Approved Issuer';
      case 'pending': return 'Pending Approval';
      case 'rejected': return 'Rejected';
      default: return 'Issuer';
    }
  }
  return 'Verifier';
});

export const User = mongoose.model('User', userSchema);
