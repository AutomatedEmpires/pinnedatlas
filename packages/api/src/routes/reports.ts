import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Report, ReportType } from '@whc/shared';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { locationService } from '../services/locationService';

// ─── In-memory reports store ──────────────────────────────────────────────────
const reports: Report[] = [];

const router = Router();

// POST /reports — authenticated users submit a report
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { locationId, type, description } = req.body as {
      locationId?: string;
      type?: ReportType;
      description?: string;
    };

    if (!locationId || !type || !description) {
      res.status(400).json({ message: 'locationId, type, and description are required' });
      return;
    }

    const location = locationService.getById(locationId);
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    const report: Report = {
      id: uuidv4(),
      locationId,
      reportedBy: req.user!.userId,
      type,
      description,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    reports.push(report);
    res.status(201).json({ data: report, message: 'Report submitted' });
  } catch (err) {
    next(err);
  }
});

// GET /reports — admin/moderator view all reports
router.get(
  '/',
  authenticate,
  requireRole('admin', 'moderator'),
  (_req: AuthenticatedRequest, res: Response) => {
    res.json({ data: reports });
  },
);

// PUT /reports/:id — admin/moderator review a report
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'moderator'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const idx = reports.findIndex((r) => r.id === req.params.id);
      if (idx === -1) {
        res.status(404).json({ message: 'Report not found' });
        return;
      }

      const { status, resolution } = req.body as {
        status?: Report['status'];
        resolution?: string;
      };

      const now = new Date().toISOString();
      reports[idx] = {
        ...reports[idx],
        ...(status ? { status } : {}),
        ...(resolution ? { resolution } : {}),
        reviewedAt: now,
        reviewedBy: req.user!.userId,
      };

      res.json({ data: reports[idx] });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
