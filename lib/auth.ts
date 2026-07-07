import 'server-only';
import { auth } from '@clerk/nextjs/server';
import { env, hasClerk } from '@/lib/env';

/** Clerk user id for the current request, or null when signed out / Clerk unconfigured. */
export async function getUserId(): Promise<string | null> {
  if (!hasClerk) return null;
  const { userId } = await auth();
  return userId;
}

/** Throws a 401-shaped error for API routes when there is no signed-in user. */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export async function isAdmin(): Promise<boolean> {
  const userId = await getUserId();
  return Boolean(userId && env.adminUserIds.includes(userId));
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Sign in required');
    this.name = 'UnauthorizedError';
  }
}
