import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useLogin, useRegister } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';

export default function AuthModal() {
  const isOpen = useUiStore((s) => s.authModalOpen);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  function handleClose() {
    setAuthModalOpen(false);
    setEmail('');
    setPassword('');
    setDisplayName('');
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    registerMutation.mutate({ displayName, email, password });
  }

  const error = loginMutation.error?.message || registerMutation.error?.message;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={tab === 'login' ? 'Sign In' : 'Create Account'}>
      {/* Tabs */}
      <div className="flex border-b mb-4 -mt-2">
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'login' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500'
          }`}
          onClick={() => setTab('login')}
        >
          Sign In
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'register' ? 'border-sky-500 text-sky-600' : 'border-transparent text-gray-500'
          }`}
          onClick={() => setTab('register')}
        >
          Register
        </button>
      </div>

      {tab === 'login' ? (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in…' : 'Sign In'}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="Trail Explorer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create Account'}
          </Button>
        </form>
      )}
    </Modal>
  );
}
