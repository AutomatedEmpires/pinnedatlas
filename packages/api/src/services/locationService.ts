import type { Location, LocationsQuery } from '@whc/shared';
import { seedLocations } from '../data/seed';

// In-memory store initialised from seed data
let locations: Location[] = [...seedLocations];

export const locationService = {
  getAll(query: LocationsQuery): { data: Location[]; total: number } {
    let results = locations.filter((l) => l.status === 'approved');

    if (query.category) {
      results = results.filter((l) => l.category === query.category);
    }

    if (query.difficulty) {
      results = results.filter((l) => l.difficulty === query.difficulty);
    }

    if (query.swimAllowed !== undefined) {
      results = results.filter((l) => l.swimAllowed === query.swimAllowed);
    }

    if (query.bounds) {
      const { north, south, east, west } = query.bounds;
      results = results.filter(
        (l) =>
          l.coordinates.lat <= north &&
          l.coordinates.lat >= south &&
          l.coordinates.lng <= east &&
          l.coordinates.lng >= west,
      );
    }

    if (query.q) {
      const term = query.q.toLowerCase();
      results = results.filter(
        (l) =>
          l.title.toLowerCase().includes(term) ||
          l.description.toLowerCase().includes(term) ||
          l.shortDescription.toLowerCase().includes(term) ||
          l.state.toLowerCase().includes(term) ||
          (l.nearestCity?.toLowerCase().includes(term) ?? false) ||
          l.tags.some((t) => t.toLowerCase().includes(term)),
      );
    }

    const total = results.length;
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 20));
    const start = (page - 1) * pageSize;
    const data = results.slice(start, start + pageSize);

    return { data, total };
  },

  getById(id: string): Location | undefined {
    return locations.find((l) => l.id === id);
  },

  getAllForAdmin(): Location[] {
    return [...locations];
  },

  create(location: Location): Location {
    locations.push(location);
    return location;
  },

  update(id: string, patch: Partial<Location>): Location | undefined {
    const idx = locations.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    locations[idx] = { ...locations[idx], ...patch, id, updatedAt: new Date().toISOString() };
    return locations[idx];
  },

  delete(id: string): boolean {
    const before = locations.length;
    locations = locations.filter((l) => l.id !== id);
    return locations.length < before;
  },

  approve(id: string, approvedBy: string): Location | undefined {
    return locationService.update(id, { status: 'approved', approvedBy });
  },

  reject(id: string, reviewNotes?: string): Location | undefined {
    return locationService.update(id, {
      status: 'rejected',
      ...(reviewNotes ? { tags: [] } : {}),
    });
  },

  getPendingCount(): number {
    return locations.filter((l) => l.status === 'pending').length;
  },

  getStats() {
    const approved = locations.filter((l) => l.status === 'approved');
    return {
      total: locations.length,
      approved: approved.length,
      pending: locations.filter((l) => l.status === 'pending').length,
      rejected: locations.filter((l) => l.status === 'rejected').length,
      byCategory: {
        hot_spring: approved.filter((l) => l.category === 'hot_spring').length,
        cave: approved.filter((l) => l.category === 'cave').length,
        waterfall: approved.filter((l) => l.category === 'waterfall').length,
      },
    };
  },
};
