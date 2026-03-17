import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLocations, getLocation, createLocation } from '../api/locations';
import type { LocationsQuery } from '../types';

export function useLocations(query: LocationsQuery = {}) {
  return useQuery({
    queryKey: ['locations', query],
    queryFn: () => getLocations(query),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: ['location', id],
    queryFn: () => getLocation(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });
}
