import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required. No token provided.' 
      });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is not configured');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired. Please login again.' 
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. Please login again.' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
}

export function authorize(...roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Unauthorized. Please login.' 
        });
      }
      
      const user = await User.findById(req.user.sub).lean();
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: 'User not found' 
        });
      }
      
      if (!user.isActive) {
        return res.status(403).json({ 
          success: false,
          message: 'Account is inactive' 
        });
      }
      
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({ 
          success: false,
          message: `Access denied. Required role: ${roles.join(' or ')}` 
        });
      }
      
      req.currentUser = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function signJwt(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const payload = { 
    sub: user._id.toString(), 
    role: user.role, 
    email: user.email 
  };
  
  const options = { 
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' 
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, options);
}