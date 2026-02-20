import { create } from 'zustand';

interface UIStore {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  
  editingGoalId: string | null;
  setEditingGoalId: (id: string | null) => void;
  
  editingFolderId: string | null;
  setEditingFolderId: (id: string | null) => void;
  
  activeTimer: {
    goalId: string;
    startedAt: number;
    elapsed: number;
  } | null;
  setActiveTimer: (timer: { goalId: string; startedAt: number; elapsed: number } | null) => void;
  
  welcomeBackDismissed: boolean;
  setWelcomeBackDismissed: (dismissed: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  setSelectedDate: (date) => set({ selectedDate: date }),
  
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  
  editingGoalId: null,
  setEditingGoalId: (id) => set({ editingGoalId: id }),
  
  editingFolderId: null,
  setEditingFolderId: (id) => set({ editingFolderId: id }),
  
  activeTimer: null,
  setActiveTimer: (timer) => set({ activeTimer: timer }),
  
  welcomeBackDismissed: false,
  setWelcomeBackDismissed: (dismissed) => set({ welcomeBackDismissed: dismissed }),
}));
