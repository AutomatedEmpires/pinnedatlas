import { create } from 'zustand';

interface UiState {
  authModalOpen: boolean;
  reportModalOpen: boolean;
  reportLocationId: string | null;
  submitLocationModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  openReportModal: (locationId: string) => void;
  closeReportModal: () => void;
  setSubmitLocationModalOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  authModalOpen: false,
  reportModalOpen: false,
  reportLocationId: null,
  submitLocationModalOpen: false,
  setAuthModalOpen: (open) => set({ authModalOpen: open }),
  openReportModal: (locationId) => set({ reportModalOpen: true, reportLocationId: locationId }),
  closeReportModal: () => set({ reportModalOpen: false, reportLocationId: null }),
  setSubmitLocationModalOpen: (open) => set({ submitLocationModalOpen: open }),
}));
