import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Report } from '../../types';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

type ReportFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export default function AdminReports() {
  const [filter, setFilter] = useState<ReportFilter>('pending');
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ['admin', 'reports', filter],
    queryFn: () => apiClient<Report[]>(`/reports?status=${filter}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, resolution }: { id: string; status: string; resolution?: string }) =>
      apiClient(`/reports/${id}`, { method: 'PUT', body: JSON.stringify({ status, resolution }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reports'] });
      toast.success('Report updated');
    },
  });

  const filterOptions: { value: ReportFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'dismissed', label: 'Dismissed' },
  ];

  const formatType = (type: string) =>
    type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Reports</h2>

      <div className="flex flex-wrap gap-2 mb-6">
        {filterOptions.map((opt) => (
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
      ) : !reports?.length ? (
        <div className="text-center text-gray-500 py-12">No reports found.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-gray-800">{formatType(report.type)}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        report.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : report.status === 'resolved'
                          ? 'bg-green-100 text-green-700'
                          : report.status === 'dismissed'
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{report.description}</p>
                  <p className="text-xs text-gray-400">
                    Location: {report.locationId} · Reported: {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {report.status === 'pending' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        updateMutation.mutate({ id: report.id, status: 'resolved', resolution: 'Issue addressed' })
                      }
                      disabled={updateMutation.isPending}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        updateMutation.mutate({ id: report.id, status: 'dismissed', resolution: 'Not actionable' })
                      }
                      disabled={updateMutation.isPending}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
