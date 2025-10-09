import express from 'express';
import { z } from 'zod';
import { User, USER_ROLES } from '../models/User.js';
import { authenticate, signJwt } from '../middleware/auth.js';

const router = express.Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum([USER_ROLES.ISSUER, USER_ROLES.VERIFIER]).optional(),
  organization: z.string().optional(),
}).refine((data) => data.role !== USER_ROLES.ADMIN, {
  message: "Admin role not allowed in regular signup",
  path: ["role"],
});

const adminSignupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  organization: z.string().optional(),
  adminSecret: z.string().min(1),
});

router.post('/signup', async (req, res, next) => {
  try {
    const input = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: input.email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: input.password, // Let the pre-save hook handle hashing
      role: input.role || USER_ROLES.VERIFIER,
      organization: input.organization,
      approvalStatus: input.role === USER_ROLES.ISSUER ? 'pending' : 'none',
      accessRequestedAt: input.role === USER_ROLES.ISSUER ? new Date() : undefined,
    });
    const token = signJwt(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    }
    next(err);
  }
});

// Admin signup route (requires secret key)
router.post('/admin-signup', async (req, res, next) => {
  try {
    const input = adminSignupSchema.parse(req.body);
    
    // Verify admin secret key
    if (input.adminSecret !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }

    const existing = await User.findOne({ email: input.email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({
      name: input.name,
      email: input.email,
      passwordHash: input.password, // Let the pre-save hook handle hashing
      role: USER_ROLES.ADMIN,
      organization: input.organization,
      approvalStatus: 'none', // Admins don't need approval
    });
    const token = signJwt(user);
    res.status(201).json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    }
    next(err);
  }
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await User.findOne({ email: input.email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await user.comparePassword(input.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signJwt(user);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    }
    next(err);
  }
});

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

router.post('/request-access', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.approvalStatus = 'pending';
    user.accessRequestedAt = new Date();
    await user.save();
    res.json({ message: 'Access requested', user: { id: user._id, approvalStatus: user.approvalStatus } });
  } catch (err) {
    next(err);
  }
});

export default router;


