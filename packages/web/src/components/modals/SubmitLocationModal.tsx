import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { useCreateLocation } from '../../hooks/useLocations';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import type { AccessType, Difficulty, LocationCategory } from '../../types';

interface SubmitLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SubmitLocationModal({ isOpen, onClose }: SubmitLocationModalProps) {
  const user = useAuthStore((s) => s.user);
  const setAuthModalOpen = useUiStore((s) => s.setAuthModalOpen);
  const createLocation = useCreateLocation();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LocationCategory>('waterfall');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderate');
  const [accessType, setAccessType] = useState<AccessType>('free');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    createLocation.mutate(
      {
        title,
        category,
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        description,
        difficulty,
        accessType,
      },
      {
        onSuccess: () => {
          toast.success('Location submitted for review!');
          setTitle('');
          setLat('');
          setLng('');
          setDescription('');
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to submit location');
        },
      }
    );
  }

  if (!user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Submit a Location">
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">You must be signed in to submit a location.</p>
          <Button
            onClick={() => {
              onClose();
              setAuthModalOpen(true);
            }}
          >
            Sign In
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit a Location">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
            placeholder="Emerald Hot Spring"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LocationCategory)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="hot_spring">Hot Spring</option>
            <option value="cave">Cave</option>
            <option value="waterfall">Waterfall</option>
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <input
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="39.5"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <input
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              placeholder="-98.35"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            placeholder="Describe this location…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
          <select
            value={accessType}
            onChange={(e) => setAccessType(e.target.value as AccessType)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="free">Free</option>
            <option value="fee_required">Fee Required</option>
            <option value="permit_required">Permit Required</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={createLocation.isPending}>
            {createLocation.isPending ? 'Submitting…' : 'Submit'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
