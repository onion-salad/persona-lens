import { create } from 'zustand';

interface SimulationState {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  incrementStep: () => void;
  resetStep: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  currentStep: 0, // 初期ステップ
  setCurrentStep: (step) => set({ currentStep: step }),
  incrementStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  resetStep: () => set({ currentStep: 0 }),
})); 