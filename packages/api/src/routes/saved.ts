import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { locationService } from '../services/locationService';
import { users } from './users';

const router = Router();

// GET /saved — return all saved locations for the authenticated user
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const saved = user.savedLocations
    .map((id) => locationService.getById(id))
    .filter((l): l is NonNullable<typeof l> => l !== undefined);

  res.json({ data: saved });
});

// POST /saved/:locationId — save a location
router.post('/:locationId', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userIdx = users.findIndex((u) => u.id === req.user?.userId);
    if (userIdx === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const location = locationService.getById(req.params.locationId);
    if (!location) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }

    if (!users[userIdx].savedLocations.includes(req.params.locationId)) {
      users[userIdx].savedLocations.push(req.params.locationId);
    }

    res.status(201).json({ message: 'Location saved', data: { savedLocations: users[userIdx].savedLocations } });
  } catch (err) {
    next(err);
  }
});

// DELETE /saved/:locationId — unsave a location
router.delete('/:locationId', authenticate, (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userIdx = users.findIndex((u) => u.id === req.user?.userId);
    if (userIdx === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    users[userIdx].savedLocations = users[userIdx].savedLocations.filter(
      (id) => id !== req.params.locationId,
    );

    res.json({ message: 'Location removed from saved', data: { savedLocations: users[userIdx].savedLocations } });
  } catch (err) {
    next(err);
  }
});

export default router;
