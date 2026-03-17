import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EmptyState
          icon={<User />}
          title="Sign in to view your profile"
          action={<Button onClick={() => setAuthModalOpen(true)}>Sign In</Button>}
        />
      </div>
    );
  }

  const initials = user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
      </div>
      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center text-center mb-4 shadow-sm">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.displayName} className="w-20 h-20 rounded-full object-cover mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-sky-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
              {initials}
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
          <p className="text-sm text-gray-500 mt-1">{user.email}</p>
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{user.savedLocations.length}</p>
              <p className="text-xs text-gray-500">Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{user.submittedLocations.length}</p>
              <p className="text-xs text-gray-500">Submitted</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {(user.role === 'admin' || user.role === 'moderator') && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/dashboard')}>
              <Shield size={16} /> Admin Dashboard
            </Button>
          )}
          <Button variant="danger" className="w-full" onClick={() => { logout(); navigate('/'); }}>
            <LogOut size={16} /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
