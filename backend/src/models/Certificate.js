import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true, index: true },
    recipientName: { type: String, required: true },
    recipientEmail: { type: String },
    courseName: { type: String, required: true },
    issuedOn: { type: Date, required: true },
    validUntil: { type: Date },
    issuer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Object },
    blockchainTxHash: { type: String },
    status: { type: String, enum: ['valid', 'revoked'], default: 'valid' },
    verificationToken: { type: String, index: true },
    studentHash: { type: String, index: true },
    ipfsHash: { type: String, index: true },
  },
  { timestamps: true }
);

export const Certificate = mongoose.model('Certificate', certificateSchema);



