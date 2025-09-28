import express from 'express';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { USER_ROLES, User } from '../models/User.js';

const router = express.Router();

router.use(authenticate, authorize(USER_ROLES.ADMIN));

router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash');
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

const updateRoleSchema = z.object({ role: z.enum([USER_ROLES.ADMIN, USER_ROLES.ISSUER, USER_ROLES.VERIFIER]) });

router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = updateRoleSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Invalid input', issues: err.issues });
    next(err);
  }
});

router.post('/issuers/:id/approve', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'approved', approvedAt: new Date() },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post('/issuers/:id/reject', async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected' },
      { new: true }
    ).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

export default router;


