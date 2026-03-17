import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface DashboardStats {
  totalLocations: number;
  pendingLocations: number;
  approvedLocations: number;
  totalReports: number;
  pendingReports: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiClient<DashboardStats>('/admin/dashboard'),
  });

  if (isLoading) return <div className="flex justify-center p-12"><LoadingSpinner /></div>;

  const cards = [
    { label: 'Total Locations', value: stats?.totalLocations ?? 0, color: 'bg-sky-50 text-sky-700' },
    { label: 'Pending Review', value: stats?.pendingLocations ?? 0, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Approved', value: stats?.approvedLocations ?? 0, color: 'bg-green-50 text-green-700' },
    { label: 'Total Reports', value: stats?.totalReports ?? 0, color: 'bg-red-50 text-red-700' },
    { label: 'Open Reports', value: stats?.pendingReports ?? 0, color: 'bg-orange-50 text-orange-700' },
    { label: 'Registered Users', value: stats?.totalUsers ?? 0, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`rounded-xl p-5 ${card.color}`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-sm mt-1 font-medium opacity-80">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
