import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectToDatabase } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import certRoutes from './routes/cert.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Fix for ES modules __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root (one level up from src)
const envPath = path.resolve(__dirname, '../.env');
console.log('Looking for .env at:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env file:', result.error.message);
  console.error('Trying current directory instead...');
  dotenv.config(); // Fallback to default location
} else {
  console.log('Loaded .env file successfully');
  console.log('Loaded', Object.keys(result.parsed || {}).length, 'variables');
}

const app = express();

// Middleware
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: frontendOrigin,
  credentials: true,
}));

app.use(morgan('dev'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cert', certRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found` 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Validate required env vars
    console.log('Validating environment variables...');
    const required = ['MONGODB_URI', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('Missing required environment variables:');
      missing.forEach(key => console.error(`   - ${key}`));
      console.error('\n Make sure your .env file exists at: backend/.env');
      console.error('Current working directory:', process.cwd());
      process.exit(1);
    }
    
    console.log('Environment variables validated');
    
    // Connect to database
    console.log('Connecting to MongoDB...');
    await connectToDatabase(process.env.MONGODB_URI);
    
    // Start server
    app.listen(PORT, () => {
      console.log('Server started successfully');
      console.log(`Listening on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Frontend: ${frontendOrigin}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    
    if (err.message.includes('MONGODB_URI')) {
      console.error('\n MongoDB Troubleshooting:');
      console.error('   1. Check if .env file exists in backend/ directory');
      console.error('   2. Verify MONGODB_URI is set correctly');
      console.error('   3. Test connection string in MongoDB Compass');
    }
    
    if (err.name === 'MongoServerError') {
      console.error('\n Database Connection Failed:');
      console.error('   - Check your MongoDB Atlas IP whitelist');
      console.error('   - Verify username/password are correct');
      console.error('   - Ensure database cluster is running');
    }
    
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

start();