import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { createReport } from '../../api/reports';
import { formatReportType } from '../../utils/formatters';
import type { ReportType } from '../../types';

const REPORT_TYPES: ReportType[] = [
  'location_inaccurate',
  'access_blocked',
  'temporarily_closed',
  'unsafe',
  'trail_washed_out',
  'private_property',
  'dangerous_conditions',
  'duplicate',
  'incorrect_info',
];

interface ReportModalProps {
  locationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ locationId, isOpen, onClose }: ReportModalProps) {
  const [type, setType] = useState<ReportType>('location_inaccurate');
  const [description, setDescription] = useState('');

  const mutation = useMutation({
    mutationFn: () => createReport({ locationId, type, description }),
    onSuccess: () => {
      toast.success('Report submitted. Thank you!');
      setDescription('');
      setType('location_inaccurate');
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to submit report');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.error('Please provide at least 10 characters of description');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report an Issue">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ReportType)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            {REPORT_TYPES.map((rt) => (
              <option key={rt} value={rt}>
                {formatReportType(rt)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={4}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
            placeholder="Describe the issue in detail…"
          />
          <p className="text-xs text-gray-400 mt-1">{description.length} / 10 min chars</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            className="flex-1"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Report'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
