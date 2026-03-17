import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User, UserRole } from '@whc/shared';
import { authenticate, requireRole, JWT_SECRET, AuthenticatedRequest } from '../middleware/auth';

// ─── In-memory users store ────────────────────────────────────────────────────

interface StoredUser extends User {
  passwordHash: string;
}

const SALT_ROUNDS = 10;

const users: StoredUser[] = [
  {
    id: 'user-admin',
    email: 'admin@whc.app',
    displayName: 'WHC Admin',
    role: 'admin' as UserRole,
    savedLocations: [],
    submittedLocations: [],
    createdAt: new Date().toISOString(),
    passwordHash: bcrypt.hashSync('Admin123!', SALT_ROUNDS),
  },
  {
    id: 'user-test',
    email: 'user@whc.app',
    displayName: 'Test User',
    role: 'user' as UserRole,
    savedLocations: [],
    submittedLocations: [],
    createdAt: new Date().toISOString(),
    passwordHash: bcrypt.hashSync('User123!', SALT_ROUNDS),
  },
];

function toPublicUser(u: StoredUser): User {
  const { passwordHash: _, ...pub } = u;
  return pub;
}

export { users, toPublicUser };

// ─── Router ───────────────────────────────────────────────────────────────────

const router = Router();

// POST /auth/register
router.post('/auth/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, displayName } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
    };

    if (!email || !password || !displayName) {
      res.status(400).json({ message: 'email, password, and displayName are required' });
      return;
    }

    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: 'Password must be at least 8 characters' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const now = new Date().toISOString();
    const newUser: StoredUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      displayName,
      role: 'user',
      savedLocations: [],
      submittedLocations: [],
      createdAt: now,
      passwordHash,
    };
    users.push(newUser);

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.status(201).json({ data: { user: toPublicUser(newUser), token } });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/auth/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ message: 'email and password are required' });
      return;
    }

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({ data: { user: toPublicUser(user), token } });
  } catch (err) {
    next(err);
  }
});

// GET /users/me
router.get('/users/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const user = users.find((u) => u.id === req.user?.userId);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  res.json({ data: toPublicUser(user) });
});

// PUT /users/me
router.put('/users/me', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const idx = users.findIndex((u) => u.id === req.user?.userId);
    if (idx === -1) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const { displayName, avatarUrl, password } = req.body as {
      displayName?: string;
      avatarUrl?: string;
      password?: string;
    };

    if (displayName) users[idx].displayName = displayName;
    if (avatarUrl !== undefined) users[idx].avatarUrl = avatarUrl;
    if (password) {
      if (password.length < 8) {
        res.status(400).json({ message: 'Password must be at least 8 characters' });
        return;
      }
      users[idx].passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    res.json({ data: toPublicUser(users[idx]) });
  } catch (err) {
    next(err);
  }
});

// GET /admin/users — admin only
router.get(
  '/admin/users',
  authenticate,
  requireRole('admin'),
  (_req: Request, res: Response) => {
    res.json({ data: users.map(toPublicUser) });
  },
);

export default router;
