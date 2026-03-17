import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MapPage from './pages/MapPage';
import DetailPage from './pages/DetailPage';
import SavedPage from './pages/SavedPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLocations from './pages/admin/AdminLocations';
import AdminReports from './pages/admin/AdminReports';
import BottomNav from './components/navigation/BottomNav';
import AuthModal from './components/modals/AuthModal';
import { useUiStore } from './store/uiStore';

function AppShell() {
  const location = useLocation();
  const { authModalOpen, setAuthModalOpen } = useUiStore();
  const hideNav =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/location/');

  return (
    <>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/location/:id" element={<DetailPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>
      </Routes>
      {!hideNav && <BottomNav />}
      <Toaster position="top-center" />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
