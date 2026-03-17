import { Router, Response, NextFunction } from 'express';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { locationService } from '../services/locationService';
import { users } from './users';

const router = Router();

// GET /admin/dashboard — stats overview
router.get(
  '/dashboard',
  authenticate,
  requireRole('admin', 'moderator'),
  (_req: AuthenticatedRequest, res: Response) => {
    const stats = locationService.getStats();
    res.json({
      data: {
        locations: stats,
        users: {
          total: users.length,
          admins: users.filter((u) => u.role === 'admin').length,
          moderators: users.filter((u) => u.role === 'moderator').length,
          regular: users.filter((u) => u.role === 'user').length,
        },
      },
    });
  },
);

// GET /admin/locations — all locations regardless of status
router.get(
  '/locations',
  authenticate,
  requireRole('admin', 'moderator'),
  (_req: AuthenticatedRequest, res: Response) => {
    const all = locationService.getAllForAdmin();
    res.json({ data: all, total: all.length });
  },
);

// PUT /admin/locations/:id/approve
router.put(
  '/locations/:id/approve',
  authenticate,
  requireRole('admin', 'moderator'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = locationService.approve(req.params.id, req.user!.userId);
      if (!updated) {
        res.status(404).json({ message: 'Location not found' });
        return;
      }
      res.json({ data: updated, message: 'Location approved' });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /admin/locations/:id/reject
router.put(
  '/locations/:id/reject',
  authenticate,
  requireRole('admin', 'moderator'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { reviewNotes } = req.body as { reviewNotes?: string };
      const updated = locationService.reject(req.params.id, reviewNotes);
      if (!updated) {
        res.status(404).json({ message: 'Location not found' });
        return;
      }
      res.json({
        data: updated,
        message: 'Location rejected',
        reviewNotes: locationService.getReviewNotes(req.params.id),
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
