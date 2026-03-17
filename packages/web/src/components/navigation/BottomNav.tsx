import { NavLink } from 'react-router-dom';
import { Map, Heart, User } from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { to: '/', label: 'Map', icon: Map, end: true },
  { to: '/saved', label: 'Saved', icon: Heart, end: false },
  { to: '/profile', label: 'Profile', icon: User, end: false },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-bottom">
      <div className="flex h-16">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                isActive ? 'text-sky-500' : 'text-gray-400 hover:text-gray-600'
              )
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
