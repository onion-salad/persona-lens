import { create } from 'zustand';
import { AIPersona, SimulationView } from '@/pages/persona-simulation/page'; // page.tsx から型をインポート
import { ExpertProposal } from '@/mastra/schemas/expertProposalSchema'; // バックエンドの型をインポート

// エキスパートの型定義 (ExpertProposalから一部抽出、またはAIPersonaを流用)
// ここでは AIPersona を流用し、必要なら拡張する方針
// type Expert = Pick<AIPersona, 'id' | 'name'> & { attributes: string; profile: string; }; 

// サマリーの型定義
type ProposalSummary = ExpertProposal['summary'];

interface SimulationState {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  incrementStep: () => void;
  resetStep: () => void;
  currentView: SimulationView;
  setCurrentView: (view: SimulationView) => void;
  experts: AIPersona[];
  setExperts: (experts: AIPersona[]) => void;
  proposalSummary: ProposalSummary | null;
  setProposalSummary: (summary: ProposalSummary | null) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  currentStep: 0, // 初期ステップ
  setCurrentStep: (step) => set({ currentStep: step }),
  incrementStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
  resetStep: () => set({ currentStep: 0 }),
  currentView: 'initial', // 初期ビュー
  setCurrentView: (view) => set({ currentView: view }),
  experts: [], // 初期状態は空配列
  setExperts: (experts) => set({ experts: experts }),
  proposalSummary: null, // 初期状態は null
  setProposalSummary: (summary) => set({ proposalSummary: summary }),
})); 