import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Location, LocationsQuery, LocationCategory, Difficulty } from '@whc/shared';
import { locationService } from '../services/locationService';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /locations
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const query: LocationsQuery = {};

  if (req.query.category) {
    query.category = req.query.category as LocationCategory;
  }
  if (req.query.difficulty) {
    query.difficulty = req.query.difficulty as Difficulty;
  }
  if (req.query.swimAllowed !== undefined) {
    query.swimAllowed = req.query.swimAllowed === 'true';
  }
  if (req.query.q) {
    query.q = String(req.query.q);
  }
  if (req.query.page) {
    query.page = parseInt(String(req.query.page), 10);
  }
  if (req.query.pageSize) {
    query.pageSize = parseInt(String(req.query.pageSize), 10);
  }

  // Bounding box: ?north=49&south=24&east=-66&west=-125
  if (req.query.north && req.query.south && req.query.east && req.query.west) {
    query.bounds = {
      north: parseFloat(String(req.query.north)),
      south: parseFloat(String(req.query.south)),
      east: parseFloat(String(req.query.east)),
      west: parseFloat(String(req.query.west)),
    };
  }

  const { data, total } = locationService.getAll(query);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;

  res.json({ data, total, page, pageSize });
});

// GET /locations/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const location = locationService.getById(req.params.id);
  if (!location) {
    res.status(404).json({ message: 'Location not found' });
    return;
  }
  res.json({ data: location });
});

// POST /locations — authenticated users may submit new locations
router.post(
  '/',
  authenticate,
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Partial<Location>;

      if (!body.title || !body.category || !body.coordinates || !body.description) {
        res.status(400).json({ message: 'title, category, coordinates, and description are required' });
        return;
      }

      const now = new Date().toISOString();
      const location: Location = {
        id: uuidv4(),
        title: body.title,
        category: body.category,
        coordinates: body.coordinates,
        description: body.description,
        shortDescription: body.shortDescription ?? body.description.slice(0, 120),
        photos: body.photos ?? [],
        primaryPhoto: body.primaryPhoto,
        difficulty: body.difficulty ?? 'moderate',
        accessType: body.accessType ?? 'free',
        hikingDistanceMi: body.hikingDistanceMi,
        hikingElevationFt: body.hikingElevationFt,
        terrain: body.terrain ?? [],
        seasonality: body.seasonality ?? ['year_round'],
        familyFriendly: body.familyFriendly ?? false,
        swimAllowed: body.swimAllowed,
        remoteness: body.remoteness ?? 'rural',
        warnings: [],
        tags: body.tags ?? [],
        status: 'pending',
        submittedBy: req.user?.userId,
        state: body.state ?? '',
        county: body.county,
        nearestCity: body.nearestCity,
        hotSpring: body.hotSpring,
        cave: body.cave,
        waterfall: body.waterfall,
        createdAt: now,
        updatedAt: now,
      };

      const created = locationService.create(location);
      res.status(201).json({ data: created, message: 'Location submitted for review' });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /locations/:id — admin only
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'moderator'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const updated = locationService.update(req.params.id, req.body as Partial<Location>);
      if (!updated) {
        res.status(404).json({ message: 'Location not found' });
        return;
      }
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /locations/:id — admin only
router.delete(
  '/:id',
  authenticate,
  requireRole('admin'),
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const deleted = locationService.delete(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: 'Location not found' });
        return;
      }
      res.json({ message: 'Location deleted' });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
