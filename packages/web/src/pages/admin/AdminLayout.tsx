import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';

export default function AdminLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return null;
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 rounded-lg text-sm font-medium ${isActive ? 'bg-sky-100 text-sky-700' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">WHC Admin</h1>
        <button onClick={() => navigate('/')} className="text-sm text-sky-600 hover:underline">
          ← Back to App
        </button>
      </header>
      <div className="flex">
        <nav className="hidden md:block w-48 bg-white border-r border-gray-200 min-h-screen p-4 space-y-1">
          <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/locations" className={linkClass}>Locations</NavLink>
          <NavLink to="/admin/reports" className={linkClass}>Reports</NavLink>
        </nav>
        <div className="flex md:hidden gap-2 px-4 py-2 bg-white border-b border-gray-200 w-full">
          <NavLink to="/admin/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/locations" className={linkClass}>Locations</NavLink>
          <NavLink to="/admin/reports" className={linkClass}>Reports</NavLink>
        </div>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
