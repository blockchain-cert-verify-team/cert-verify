import mongoose from 'mongoose';

export async function connectToDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is required. Please check your .env file.');
  }

  // Validate MongoDB URI format
  if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  try {
    mongoose.set('strictQuery', true);
    
    await mongoose.connect(mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('MongoDB connected successfully');

    // Connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('[mongo] connected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('[mongo] connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[mongo] disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[mongo] reconnected');
    });

    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    
    if (error.message.includes('authentication failed')) {
      throw new Error('MongoDB authentication failed. Check username/password in MONGODB_URI');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      throw new Error('MongoDB host not found. Check your connection string');
    }
    
    if (error.message.includes('timeout')) {
      throw new Error('MongoDB connection timeout. Check network/firewall settings');
    }
    
    throw error;
  }
}