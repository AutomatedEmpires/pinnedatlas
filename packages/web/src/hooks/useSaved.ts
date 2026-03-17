import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSaved, saveLocation, unsaveLocation } from '../api/saved';
import { useAuthStore } from '../store/authStore';

export function useSavedLocations() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: ['saved'],
    queryFn: getSaved,
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) => saveLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}

export function useUnsaveLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (locationId: string) => unsaveLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved'] });
    },
  });
}
