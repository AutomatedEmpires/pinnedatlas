import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Location, ListingStatus } from '../../types';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type FilterStatus = 'all' | ListingStatus;

export default function AdminLocations() {
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const queryClient = useQueryClient();

  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ['admin', 'locations', filter],
    queryFn: () => apiClient<Location[]>(`/admin/locations?status=${filter}`),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/admin/locations/${id}/approve`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Location approved');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/admin/locations/${id}/reject`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      toast.success('Location rejected');
    },
  });

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Locations</h2>

      <div className="flex gap-2 mb-6">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === opt.value
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><LoadingSpinner /></div>
      ) : !locations?.length ? (
        <div className="text-center text-gray-500 py-12">No locations found.</div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc) => (
            <div key={loc.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start gap-4">
              {loc.primaryPhoto && (
                <img
                  src={loc.primaryPhoto}
                  alt={loc.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900 truncate">{loc.title}</span>
                  <Badge variant="category" value={loc.category} />
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      loc.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : loc.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {loc.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">{loc.state} · {loc.difficulty}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{loc.shortDescription}</p>
              </div>
              {loc.status === 'pending' && (
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => approveMutation.mutate(loc.id)}
                    disabled={approveMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => rejectMutation.mutate(loc.id)}
                    disabled={rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
