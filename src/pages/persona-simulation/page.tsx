import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bot,
  User,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Loader2,
  RotateCcw,
  PanelLeft,
  MessageSquare,
  MessageSquarePlus, // ★ Import new icon
  Edit3,
  BarChart3,
  Filter,
  SendHorizontal,
  BarChartHorizontalBig,
  Smile,
  Frown,
  Tags,
  Meh,
  List,
  Users,
  Minus,
  Plus,
  Menu as MenuIcon,
  X,
  Home,
  LayoutDashboard,
  GitMerge,
  ListChecks,
  X as XIconImport,
  Home as HomeIconImport,
  Sparkles as SparklesIconImport,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { useSimulationStore } from "@/lib/store/simulationStore"; // ストアをインポート
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from "@/components/ui/progress";
import { AI_Prompt } from '@/components/ui/animated-ai-input'; // ★ Import AI_Prompt
import { MenuItem, MenuContainer } from "@/components/ui/fluid-menu"; // ★ Import fluid-menu
import { useNavigate } from 'react-router-dom'; // ★ Import useNavigate
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave"; // ★ Import TextShimmerWave
import { cn } from "@/lib/utils"; // Import cn for conditional classes
import { SimulationViewVerticalMenu } from './components/SimulationViewTabs'; // ★ 新しい縦型メニューをインポート (ファイル名はそのまま SimulationViewTabs.tsx を使用)
import { ExpertProposal } from "@/mastra/schemas/expertProposalSchema"; // ExpertProposal全体をインポート
// import { type AIPersona } from './types'; // AIPersonaを別ファイルからインポート (page.tsx内の定義を移動した場合)

// ProposalSummary 型を ExpertProposal から抽出
type ProposalSummary = ExpertProposal['summary'];

// SimulationView 型定義を確認・修正


// 仮の型定義 (AIPersona) - page.tsx内に定義する場合
// ★ Enable this type definition
export type AIPersona = {
  id: string;
  name: string;
  details: string; 
  response: string; 
  emotionScore?: number; 
  attributes?: string; 
  profile?: string;
};

// (もし ./types に移動した場合は上記コメントアウト)

type AISuggestion = {
  personaCountOptions: number[];
  selectedPersonaCount: number;
  attributes: string; // 例: "性別: 女性, 国籍: 日本, 経済状況: 中流"
  detailLevel: 'low' | 'medium' | 'high';
};

type DetailLevel = 'low' | 'medium' | 'high'; // DetailLevel型を抽出
const detailLevels: DetailLevel[] = ['low', 'medium', 'high'];
const detailLevelLabels: { [key in DetailLevel]: string } = {
  low: '低',
  medium: '中',
  high: '高',
};

// 結果セットの型
type ResultSet = {
  id: string; // 結果セットを識別するID (例: 'initial', 'follow-up-1')
  title: string; // テーブルのタイトル (例: '初期結果', '追加質問: 価格について')
  personas: AIPersona[];
};

// チャットメッセージの型
type ChatMessage = {
  id: string;
  role: 'user' | 'ai' | 'system' | 'orchestrator' | 'persona'; // 'orchestrator'と'persona'を追加
  content: string;
  speaker?: string; // 発言者名（オーケストレーターやペルソナ名）
  actions?: ChatAction[];
  actionPayload?: any;
  proposal?: {
    question: string;
    onConfirm: () => void;
    onDeny: () => void;
  };
  canDeepDive?: boolean;
};

type ChatAction = {
  id: string;
  label: string;
  // onClick can now optionally receive payload
  onClick: (payload?: any) => void;
};

// Define possible views for the dynamic content area
export type SimulationView =
  | 'initial'           // Welcome message, initial prompt
  | 'request_input'     // User inputs the simulation request (explicit step if needed)
  | 'confirmation'      // AI shows suggestions, user confirms/adjusts
  | 'generating'        // Loading indicator while personas are generated
  | 'results_dashboard' // Displaying the persona stats dashboard
  | 'analysis_result'   // Displaying analysis result
  | 'persona_list'      // Add persona list view
  | 'persona_detail'    // Add persona detail view
  | 'relationship_diagram' // ★ New view for relationship diagram
  | 'action_suggestions' // ★ New view for action suggestions
  | 'error';            // Error state

// ★ メニュー項目として表示するビューを定義
const mainSimulationMenuItems: { view: SimulationView; label: string; icon?: React.ElementType }[] = [
  { view: 'results_dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { view: 'persona_list', label: 'ペルソナ一覧', icon: Users },
  { view: 'relationship_diagram', label: '関係図', icon: GitMerge },
  { view: 'action_suggestions', label: '改善アクション', icon: ListChecks },
];

// 洗練された Step 1: 要望入力
const Step1_Input: React.FC<{ onSubmit: (request: string) => void }> = ({ onSubmit }) => {
  const [request, setRequest] = useState('');
  
  return (
    <div className="w-full max-w-6xl bg-white transition-all duration-300 border-none">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <CardTitle className="text-2xl font-bold text-gray-900">シミュレーション内容の入力</CardTitle>
        </div>
        <CardDescription className="text-gray-600 text-base">
          AI人格に評価させたい内容や、達成したいタスクを入力してください。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Textarea
          placeholder="例: 新しいタスク管理アプリの使い勝手を評価してほしい。特にUIの直感性と機能の網羅性について意見が聞きたい。"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={8}
          className="w-full p-4 text-base text-gray-900 bg-gray-50 rounded-md focus:border-gray-400 focus:ring-gray-400 resize-none"
        />
      </CardContent>
      
      <CardFooter className="flex justify-end pt-2">
        <Button 
          onClick={() => onSubmit(request)} 
          disabled={!request.trim()} 
          className="px-8 py-6 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
        >
          <span>AIに要望を送信</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </CardFooter>
    </div>
  );
};

// --- Step 2: Confirmation Component ---
interface Step2ConfirmationProps {
  suggestion: AISuggestion;
  onApprove: (updatedSuggestion: { count: number; level: DetailLevel }) => void;
  onRegenerate: (feedback?: string, updatedSuggestion?: { count: number; level: DetailLevel }) => void;
}

const Step2_Confirmation: React.FC<Step2ConfirmationProps> = ({
  suggestion,
  onApprove,
  onRegenerate,
}) => {
  const [feedback, setFeedback] = useState('');
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [displayCount, setDisplayCount] = useState(suggestion.selectedPersonaCount);
  const [displayDetailLevel, setDisplayDetailLevel] = useState<DetailLevel>(suggestion.detailLevel);

  const handleRegenerateClick = () => {
    if (showFeedbackInput) {
      onRegenerate(feedback.trim() || undefined, { count: displayCount, level: displayDetailLevel });
    } else {
      setShowFeedbackInput(true);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8"> 
      <div className="bg-gray-50 p-6 rounded-md space-y-6 mb-6 border border-gray-200">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-gray-700 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">AIのシミュレーション提案</h3>
            <div className="space-y-6 text-gray-700 text-sm">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="font-medium">必要なペルソナ:</Label>
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">{displayCount}人</span>
                </div>
                <Slider
                  value={[displayCount]}
                  onValueChange={(value) => setDisplayCount(value[0])}
                  min={1}
                  max={50}
                  step={1}
                />
                <div className="text-xs text-gray-500">
                    推奨オプション: {suggestion.personaCountOptions.join(', ')}人
                  </div>
              </div>

              <div className="space-y-3">
                <Label className="font-medium">詳細度:</Label>
                <RadioGroup
                  value={displayDetailLevel}
                  onValueChange={(value: string) => setDisplayDetailLevel(value as DetailLevel)}
                  className="flex items-center space-x-4"
                >
                  {detailLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={level} 
                        id={`detail-${level}`} 
                        className="border-gray-400 text-gray-900"
                      />
                      <Label 
                        htmlFor={`detail-${level}`} 
                        className="text-sm font-normal text-gray-700 cursor-pointer"
                      >
                        {detailLevelLabels[level]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="flex items-start">
                <Label className="font-medium min-w-[100px]">ペルソナ属性:</Label>
                <span className="ml-2 text-gray-800">{suggestion.attributes}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFeedbackInput && (
        <div className="mb-6">
          <Label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">修正指示・追加要望 (任意)</Label>
          <Textarea
            id="feedback"
            placeholder="例: もっと若年層の意見も聞きたいので、20代のペルソナを増やしてください。"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="w-full p-4 text-base text-gray-900 bg-gray-50 rounded-md border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 resize-none"
            autoFocus
          />
        </div>
      )}

      <div className="flex justify-between items-center">
        <Button
          onClick={handleRegenerateClick}
          className="px-5 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors duration-200 flex items-center space-x-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{showFeedbackInput ? '指示を送信して再生成' : '修正指示を追加'}</span>
        </Button>
        <Button
          onClick={() => onApprove({ count: displayCount, level: displayDetailLevel })}
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors duration-200 flex items-center space-x-2"
        >
          <span>承認して次へ進む</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

// 洗練された Step 3: ペルソナ生成中
const Step3_Generation: React.FC = () => {
  return (
    <div className="w-full max-w-3xl mx-auto py-16 flex flex-col items-center justify-center text-center">
      <div className="relative w-16 h-16 mb-6">
        <Loader2 className="w-16 h-16 text-gray-300 animate-spin" />
        <Sparkles className="w-8 h-8 text-gray-900 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">AIペルソナ生成中...</h2>
        <p className="text-gray-600 max-w-md">
          承認された内容に基づき、あなたの要望に最適なペルソナを生成しています。このプロセスには数秒かかることがあります。
        </p>
      </div>
    </div>
  );
};

// --- 新しいUIコンポーネント ---

// 1. Chat Input Bar (Bottom Fixed)
interface ChatInputBarProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean; // To disable input during AI processing
}
const ChatInputBar: React.FC<ChatInputBarProps> = ({ onSendMessage, isLoading }) => {
  const [userInput, setUserInput] = useState('');

  const handleSend = () => {
    if (!userInput.trim() || isLoading) return;
    onSendMessage(userInput);
    setUserInput('');
  };

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
      <div className="relative flex items-center max-w-3xl mx-auto">
        <Input
          type="text"
          placeholder="AIへの指示やメッセージを入力..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isLoading}
          className="w-full pr-12 py-3 pl-4 border-gray-300 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 text-base"
        />
        <Button
          onClick={handleSend}
          disabled={!userInput.trim() || isLoading}
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-full disabled:opacity-50 transition-all"
        >
           {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <SendHorizontal className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

// 2. Chat History Area (Middle Scrollable)
interface ChatHistoryAreaProps {
  chatHistory: ChatMessage[];
  // ★ Update the type signature to match the actual handleSendMessage
  onSendMessage: (message: string, modeOrAction: 'normal' | 'persona_question' | `Action: ${string}`, payload?: any) => void; 
}
// ★ Update component signature to accept onSendMessage
const ChatHistoryArea: React.FC<ChatHistoryAreaProps> = ({ chatHistory, onSendMessage }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [chatHistory]);

  return (
    // ★ Adjust ChatHistoryArea container: remove fixed height, add flex-grow for vertical expansion
    <div 
      className="flex-grow overflow-hidden bg-white relative min-h-0"
      style={{ // ★ Add blur effect to the top of the chat history
        maskImage: 'linear-gradient(to top, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 85%, transparent 100%)',
      }}
    >
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="space-y-5 px-6 pb-5 pt-12 max-w-4xl mx-auto"> {/* Ensure pt-12 is enough to clear the blur */}
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* 吹き出し */}
              <div className={`rounded-xl px-3.5 py-2.5 text-sm ${ 
                msg.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : msg.role === 'system'
                    ? 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                    : msg.role === 'orchestrator'
                      ? 'bg-blue-50 text-blue-900 border border-blue-100'
                      : msg.role === 'persona'
                        ? 'bg-green-50 text-green-900 border border-green-100'
                        : 'bg-white text-gray-800 border border-gray-200'
              }`}>
                {/* speakerがあれば上部に表示 */}
                {msg.speaker && (
                  <div className="text-xs font-semibold mb-1 text-gray-500 flex items-center gap-1">
                    {msg.role === 'orchestrator' && <span className="text-blue-600">🎤 オーケストレーター</span>}
                    {msg.role === 'persona' && <span className="text-green-600">👤 {msg.speaker}</span>}
                    {msg.role !== 'orchestrator' && msg.role !== 'persona' && <span>{msg.speaker}</span>}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {/* ★ Show Deep Dive button for AI messages */}
                {msg.role === 'ai' && (
                  <div className="mt-2 border-t border-gray-100 dark:border-gray-700/50 pt-2">
                    <Button
                      variant="ghost"
                      // ★ Use size="sm" and adjust padding/height via className
                      size="sm" 
                      onClick={() => onSendMessage(msg.content, 'Action: Request Deep Dive', { targetMessageId: msg.id, originalContent: msg.content })}
                      // ★ Adjust className for smaller size and padding
                      className="text-xs h-6 px-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-300"
                    >
                      <MessageSquarePlus className="w-3 h-3 mr-1" />
                      もっと深掘りする
                    </Button>
                  </div>
                )}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        // ★ Adjust button styles for default text visibility
                        variant={msg.role === 'system' ? "secondary" : "outline"}
                        onClick={() => action.onClick(msg.actionPayload)}
                        className={cn(
                            "px-3 py-1 text-xs",
                            // Ensure default text color is visible
                            msg.role === 'system' ? "text-secondary-foreground hover:bg-secondary/90" : "text-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {chatHistory.length === 0 && (
             <div className="text-center text-gray-400 py-16 text-sm">
               AIとの対話を開始してください。
             </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// 3. Dynamic Content Area (Top Flexible)
interface DynamicContentAreaProps {
  currentView: SimulationView;
  isLoading: boolean; // Added isLoading to show loading indicator
  onSubmitRequest: (request: string) => void;
  experts: AIPersona[]; // 新しく追加 (ストアから渡される)
  proposalSummary: ProposalSummary | null; // 新しく追加 (ストアから渡される)
  userRequestForConfirmation: string | null;
  aiSuggestion: AISuggestion | null;
  onSettingsChange: (newSettings: { count: number; level: DetailLevel }) => void;
  analysisType: string | null;
  selectedPersonaId: string | null; // For detail view
  onSelectPersona: (id: string) => void; // For detail view
  onBackToList: () => void;
  onBackToDashboard: () => void;
  onViewPersonaList: () => void;
  onPersonaUpdate: (updatedPersona: AIPersona) => void;
  selectedPersonaIdsForQuery: string[];
  onPersonaSelectionChange: (personaId: string, isSelected: boolean) => void;
  // ★ Props for select all functionality for PersonaListView
  onToggleSelectAllPersonasInList: () => void;
  isAllPersonasInListSelected: boolean;
  // ★ Prop for handling node click in relationship diagram
  onRelationshipNodeClick: (nodeId: string) => void;
}

// --- View Specific Components --- 
const WelcomeView: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
     <Sparkles className="w-12 h-12 text-gray-400 mb-4" />
    <h2 className="text-xl font-semibold text-gray-800 mb-2">AIペルソナシミュレーションへようこそ</h2>
    <p className="text-gray-600 max-w-md">
      下のチャット欄に、AIペルソナに評価させたい内容や達成したいタスクを入力して、シミュレーションを開始してください。
    </p>
     <p className="text-sm text-gray-500 mt-4">例: 「新しいタスク管理アプリのUIについて、20代のデザイナーと40代のマネージャーの視点から評価してほしい」</p>
  </div>
);

// This view might be triggered explicitly by AI or user command if needed
const RequestInputView: React.FC<{ onSubmit: (request: string) => void }> = ({ onSubmit }) => {
   const [request, setRequest] = useState('');
   return (
     <div className="p-6 h-full flex flex-col">
        <Label htmlFor="request-input" className="text-lg font-semibold text-gray-700 mb-3">シミュレーション内容を入力してください</Label>
       <Textarea
         id="request-input"
         placeholder="例: 新しいタスク管理アプリの使い勝手を評価してほしい。特にUIの直感性と機能の網羅性について意見が聞きたい。"
         value={request}
         onChange={(e) => setRequest(e.target.value)}
         rows={10}
         className="flex-grow w-full p-4 text-base text-gray-900 bg-gray-50 rounded-md focus:border-gray-400 focus:ring-gray-400 resize-none mb-4"
         autoFocus
       />
        <div className="flex justify-end">
          <Button onClick={() => onSubmit(request)} disabled={!request.trim()}>
             要望を送信
          </Button>
        </div>
     </div>
   );
 };

const GeneratingView: React.FC<{ count: number; level: DetailLevel }> = ({ count, level }) => (
   <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-600">
     <Loader2 className="w-10 h-10 mb-4 animate-spin" />
    <p className="text-lg mb-1">AIペルソナ生成中...</p>
     <p className="text-sm text-gray-500">({count}人, 詳細度: {detailLevelLabels[level]})</p>
  </div>
);

// Placeholder for Dashboard view - requires dashboard components to be redefined or imported
const DashboardView: React.FC = () => (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">結果ダッシュボード (仮)</h2>
      <p className="text-gray-600">ここに統計情報やペルソナの概要が表示されます。</p>
      {/* TODO: Re-integrate or rebuild dashboard components here */}
   </div>
 );

const ConfirmationView: React.FC<{ userRequest: string; suggestion: AISuggestion; onSettingsChange: (newSettings: { count: number; level: DetailLevel }) => void }> = ({ userRequest, suggestion, onSettingsChange }) => {
  const [displayCount, setDisplayCount] = useState(suggestion.selectedPersonaCount);
  const [displayDetailLevel, setDisplayDetailLevel] = useState<DetailLevel>(suggestion.detailLevel);

  // Slider settings
  const minValue = 1;
  const maxValue = 50;
  const steps = 1; // Step is 1 for persona count

  useEffect(() => { onSettingsChange({ count: displayCount, level: displayDetailLevel }); }, [displayCount, displayDetailLevel, onSettingsChange]);

  const handleSliderChange = (value: number[]) => {
      setDisplayCount(value[0]);
  };

  const decreaseValue = () => setDisplayCount((prev) => Math.max(minValue, prev - steps));
  const increaseValue = () => setDisplayCount((prev) => Math.min(maxValue, prev + steps));

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 md:p-8 text-center max-w-3xl mx-auto">
      <Bot className="w-10 h-10 text-gray-500 mb-4" />
      <h2 className="text-lg font-semibold text-gray-800 mb-2">生成内容の提案・確認</h2>
      <p className="text-gray-600 max-w-lg mb-4">AIが以下の内容でペルソナ生成を提案しています...</p>
      <blockquote className="w-full bg-gray-50 p-3 rounded-md border border-gray-200 text-sm text-left mb-6 text-gray-700">リクエスト: "{userRequest}"</blockquote>
       <div className="w-full bg-gray-50 p-5 rounded-md border border-gray-200 space-y-5 mb-6 text-left"> 
         <div className="space-y-2.5">
           <Label className="font-medium text-gray-700">必要なペルソナ: <span className="font-semibold tabular-nums text-gray-900">{displayCount}人</span></Label>
           <div className="flex items-center gap-3"> 
             <Button
               variant="outline"
               size="icon"
               className="size-7"
               aria-label="ペルソナ数を減らす"
               onClick={decreaseValue}
               disabled={displayCount === minValue}
             >
               <Minus size={14} strokeWidth={2.5} aria-hidden="true" />
             </Button>
             <Slider
               className="grow"
               value={[displayCount]}
               onValueChange={handleSliderChange}
               min={minValue}
               max={maxValue}
               step={steps}
               showTooltip={true}
               tooltipContent={(value) => `${value}人`}
               aria-label="ペルソナ数スライダー"
             />
              <Button
               variant="outline"
               size="icon"
               className="size-7"
               aria-label="ペルソナ数を増やす"
               onClick={increaseValue}
               disabled={displayCount === maxValue}
             >
               <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
             </Button>
           </div>
            <div className="text-xs text-gray-500 pt-1">
               推奨オプション: {suggestion.personaCountOptions.join(', ')}人
             </div>
         </div>

         <div className="space-y-2">
           <Label className="font-medium text-gray-700">詳細度:</Label>
           <RadioGroup 
              value={displayDetailLevel}
              onValueChange={(value: string) => setDisplayDetailLevel(value as DetailLevel)}
              className="flex items-center space-x-4"
            >
              {detailLevels.map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={level} 
                    id={`detail-${level}`} 
                    className="border-gray-400 text-gray-900" // Radio itself is styled
                  />
                  <Label 
                    htmlFor={`detail-${level}`} 
                    className="text-sm font-normal text-gray-700 cursor-pointer" // Label for radio item is styled
                  >
                    {detailLevelLabels[level]}
                  </Label>
                </div>
              ))}
            </RadioGroup>
         </div>

         <div className="flex items-start text-sm pt-2">
            <Label className="font-medium min-w-[70px] text-gray-700">推奨属性:</Label>
            <span className="ml-2 text-gray-800">{suggestion.attributes}</span>
         </div>
       </div>
    </div>
  );
};

const ErrorView = () => <div className="p-4 text-red-600 text-center">エラーが発生しました。</div>; // Placeholder

// --- ResultsDashboardView (Re-implementing based on old PersonaDashboard) ---
interface ResultsDashboardViewProps {
  experts: AIPersona[]; // experts を受け取る
  summary: ProposalSummary | null; // summary を受け取る
  onViewPersonaList: () => void; // Add callback to navigate to list
}

// ★ Update ResultsDashboardView implementation
const ResultsDashboardView: React.FC<ResultsDashboardViewProps> = ({ experts, summary, onViewPersonaList }) => {
  const expertCount = experts.length;

  // 簡単なダッシュボード表示 (仮)
  return (
    <Card className="w-full max-w-4xl bg-white transition-all duration-300 border-none">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">提案結果ダッシュボード</CardTitle>
        {summary && (
          <CardDescription>
            {summary.persona_count}名の専門家候補が見つかりました。主な属性: {summary.main_attributes}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-gray-600">現在 {expertCount} 名の専門家が表示されています。</p>
        {/* ここにグラフや統計情報を追加 */} 
        <div className="p-6 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-500">(グラフ表示エリア)</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onViewPersonaList} variant="outline" className="flex items-center space-x-2">
          <List className="w-4 h-4"/>
          <span>ペルソナ一覧へ</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

interface AnalysisResultViewProps {
   analysisType: string;
   personas: AIPersona[];
   onViewPersonaList: () => void; // Add callback to navigate to list
}

// --- SVG Chart Components (Add within or near AnalysisResultView) ---

interface Point { x: number; y: number; }

// Basic Radar Chart Component
interface RadarChartProps {
  data: { label: string; score: number }[]; // e.g., [{ label: 'Joy', score: 80 }, ...]
  size: number;
}
const RadarChart: React.FC<RadarChartProps> = ({ data, size }) => {
  if (!data || data.length === 0) return null;
  const center = size / 2;
  const radius = size * 0.4;
  const numAxes = data.length;
  const angleSlice = (Math.PI * 2) / numAxes;

  // Calculate polygon points
  const points: Point[] = data.map((item, i) => {
    const angle = angleSlice * i - Math.PI / 2; // Start from top
    const scoreRadius = (item.score / 100) * radius;
    return {
      x: center + scoreRadius * Math.cos(angle),
      y: center + scoreRadius * Math.sin(angle),
    };
  });
  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');

  // Calculate axis lines and labels
  const axes = data.map((item, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const endX = center + radius * Math.cos(angle);
    const endY = center + radius * Math.sin(angle);
    const labelX = center + (radius + 15) * Math.cos(angle); // Adjust label position
    const labelY = center + (radius + 15) * Math.sin(angle);
    return {
      line: { x1: center, y1: center, x2: endX, y2: endY },
      label: { x: labelX, y: labelY, text: item.label },
    };
  });

  // Basic grid lines (e.g., 50% and 100%)
  const gridPoints = (scale: number) => data.map((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const gridRadius = scale * radius;
      return { x: center + gridRadius * Math.cos(angle), y: center + gridRadius * Math.sin(angle) };
  }).map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g className="text-gray-300">
        {/* Grid Lines */}
        <polygon points={gridPoints(1)} fill="none" stroke="currentColor" strokeWidth="0.5" />
        <polygon points={gridPoints(0.5)} fill="none" stroke="currentColor" strokeWidth="0.5" />
        {/* Axes Lines */}
        {axes.map((axis, idx) => (
          <line key={`axis-${idx}`} {...axis.line} stroke="currentColor" strokeWidth="0.5" />
        ))}
      </g>
      {/* Data Polygon */}
      <polygon points={pointsString} fill="rgba(67, 56, 202, 0.3)" stroke="rgb(67, 56, 202)" strokeWidth="1.5" />
       {/* Data Points */}
       {points.map((p, idx) => <circle key={`point-${idx}`} cx={p.x} cy={p.y} r="2.5" fill="rgb(67, 56, 202)" />)}
      {/* Labels */}
      <g className="text-[8px] text-gray-600 fill-current">
        {axes.map((axis, idx) => (
          <text key={`label-${idx}`} x={axis.label.x} y={axis.label.y} textAnchor="middle" dominantBaseline="middle">
            {axis.label.text}
          </text>
        ))}
      </g>
    </svg>
  );
};


// Basic 4-Quadrant Chart Component
interface QuadrantChartProps {
   personas: { id: string; name: string; sentiment: number; engagement: number }[]; // sentiment -1 to +1, engagement 0 to 1
   size: number;
}
const QuadrantChart: React.FC<QuadrantChartProps> = ({ personas, size }) => {
   const padding = 30; // Padding for labels/axes
   const plotSize = size - 2 * padding;
   const centerX = padding + plotSize / 2;
   const centerY = padding + plotSize / 2;

   const scaleX = (engagement: number) => centerX + engagement * (plotSize / 2); // Map 0-1 to centerX to right edge
   const scaleY = (sentiment: number) => centerY - sentiment * (plotSize / 2); // Map -1 to +1 to bottom to top edge

   return (
     <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
       {/* Axes */}
       <line x1={padding} y1={centerY} x2={size - padding} y2={centerY} stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" />
       <line x1={centerX} y1={padding} x2={centerX} y2={size - padding} stroke="rgba(156, 163, 175, 0.5)" strokeWidth="1" />
        {/* Axes Labels */}
        <text x={size - padding + 5} y={centerY} dy="0.3em" className="text-[9px] fill-gray-500" textAnchor="start">エンゲージメント →</text>
        <text x={centerX} y={padding - 8} className="text-[9px] fill-gray-500" textAnchor="middle">↑ 感情ポジティブ</text>
        <text x={centerX} y={size - padding + 12} className="text-[9px] fill-gray-500" textAnchor="middle">↓ 感情ネガティブ</text>

       {/* Data Points */}
       <g>
         {personas.map(p => {
            const cx = scaleX(p.engagement);
            const cy = scaleY(p.sentiment);
            let color = "text-gray-500"; // Neutral default
            if (p.sentiment > 0.2) color = "text-green-500";
            else if (p.sentiment < -0.2) color = "text-red-500";

            return (
               <TooltipProvider key={p.id} delayDuration={100}>
                  <Tooltip>
                     <TooltipTrigger asChild>
                         <circle cx={cx} cy={cy} r="3.5" className={`fill-current ${color} opacity-70 hover:opacity-100 cursor-pointer`} />
                     </TooltipTrigger>
                     <TooltipContent className="text-xs bg-gray-800 text-white border-none shadow-lg rounded px-2 py-1">
                        {p.name} (感情: {p.sentiment.toFixed(2)}, E: {p.engagement.toFixed(2)})
                     </TooltipContent>
                  </Tooltip>
               </TooltipProvider>
            );
         })}
       </g>
     </svg>
   );
};

const AnalysisResultView: React.FC<AnalysisResultViewProps> = ({ analysisType, personas, onViewPersonaList }) => {
   let content: React.ReactNode = <p>分析結果の表示準備中です...</p>;
   const totalPersonas = personas.length;

   if (totalPersonas === 0) {
      content = <p className="text-gray-500 text-center py-4">分析対象のペルソナデータがありません。</p>;
   } else if (analysisType === '感情分析') {
     // --- Mock Sentiment Analysis Data --- 
     const sentimentData = personas.map(p => {
       const text = (p.response + ' ' + p.details).toLowerCase();
       let sentimentScore = 0; // -1 to +1
       let positiveKeywords = 0;
       let negativeKeywords = 0;
       if (text.includes('良い') || text.includes('素晴らしい') || text.includes('満足') || text.includes('好き')) positiveKeywords++;
       if (text.includes('悪い') || text.includes('問題') || text.includes('不満') || text.includes('嫌い')) negativeKeywords++;
       sentimentScore = (positiveKeywords - negativeKeywords) / (positiveKeywords + negativeKeywords || 1); // Normalize roughly

       let engagementScore = Math.min(1, text.length / 500); // Base on length (up to 500 chars = 1)
       if (text.includes('思う') || text.includes('感じる') || text.includes('提案')) engagementScore = Math.min(1, engagementScore + 0.3); // Boost if keywords present

       let sentimentCategory: 'positive' | 'negative' | 'neutral' = 'neutral';
       if (sentimentScore > 0.2) sentimentCategory = 'positive';
       else if (sentimentScore < -0.2) sentimentCategory = 'negative';

       return {
          id: p.id,
          name: p.name,
          sentiment: sentimentScore,
          engagement: engagementScore, // 0 to 1
          category: sentimentCategory
       };
     });

     const positiveCount = sentimentData.filter(s => s.category === 'positive').length;
     const negativeCount = sentimentData.filter(s => s.category === 'negative').length;
     const neutralCount = totalPersonas - positiveCount - negativeCount; // Ensure sum is total
     const positivePercent = Math.round((positiveCount / totalPersonas) * 100);
     const negativePercent = Math.round((negativeCount / totalPersonas) * 100);
     const neutralPercent = Math.max(0, 100 - positivePercent - negativePercent); // Ensure non-negative

     // --- Mock Radar Chart Data --- 
     const radarLabels: string[] = ['喜び', '信頼', '驚き', '期待', '怒り', '悲しみ'];
     // Generate simple aggregate scores based on overall sentiment
     const avgSentiment = sentimentData.reduce((sum, p) => sum + p.sentiment, 0) / totalPersonas;
     const radarData = radarLabels.map(label => {
         let score = 50 + Math.random() * 20 - 10; // Base random score
         if (label === '喜び' || label === '信頼' || label === '期待') score += avgSentiment * 30; // Boost positive emotions if overall sentiment is positive
         if (label === '怒り' || label === '悲しみ') score -= avgSentiment * 30; // Boost negative if overall is negative
         if (label === '驚き') score += Math.abs(avgSentiment * 15); // Surprise boosted by stronger sentiment (pos or neg)
         return { label, score: Math.max(0, Math.min(100, Math.round(score))) }; // Clamp between 0-100
     });


     // --- Updated Content Rendering --- 
     content = (
       <div className="space-y-6">
          {/* Sentiment Breakdown (Existing Card with Progress bars) */}
         <Card className="bg-gray-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">全体的な感情傾向</CardTitle>
            </CardHeader>
             <CardContent className="space-y-4">
                {/* Progress Bars for Positive/Negative/Neutral */}
               <div>
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-sm font-medium text-green-600 flex items-center"><Smile className="w-4 h-4 mr-1.5"/>ポジティブ</span>
                   <span className="text-sm font-semibold text-green-600">{positivePercent}%</span>
                 </div>
                 <Progress value={positivePercent} className="h-2 bg-green-100 [&>*]:bg-green-500" />
               </div>
               <div>
                  <div className="flex justify-between items-center mb-1">
                   <span className="text-sm font-medium text-red-600 flex items-center"><Frown className="w-4 h-4 mr-1.5"/>ネガティブ</span>
                   <span className="text-sm font-semibold text-red-600">{negativePercent}%</span>
                 </div>
                 <Progress value={negativePercent} className="h-2 bg-red-100 [&>*]:bg-red-500" />
               </div>
               <div>
                 <div className="flex justify-between items-center mb-1">
                   <span className="text-sm font-medium text-gray-600 flex items-center"><Meh className="w-4 h-4 mr-1.5"/>ニュートラル</span>
                   <span className="text-sm font-semibold text-gray-600">{neutralPercent}%</span>
                 </div>
                 <Progress value={neutralPercent} className="h-2 bg-gray-200 [&>*]:bg-gray-500" />
               </div>
            </CardContent>
         </Card>

          {/* New Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* 4 Quadrant Chart */}
             <Card className="bg-gray-50/50">
                <CardHeader className="pb-2">
                   <CardTitle className="text-base font-semibold">感情 x エンゲージメント分布</CardTitle>
                   <CardDescription className="text-xs">各ペルソナの位置（簡易分析）</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center pt-0">
                   <QuadrantChart personas={sentimentData} size={260} />
                </CardContent>
             </Card>

             {/* Radar Chart */}
             <Card className="bg-gray-50/50">
                <CardHeader className="pb-2">
                   <CardTitle className="text-base font-semibold">主要感情バランス（全体平均）</CardTitle>
                    <CardDescription className="text-xs">6つの感情軸での傾向（モック）</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center pt-0">
                    <RadarChart data={radarData} size={260} />
                </CardContent>
             </Card>
          </div>

           {/* Persona List Excerpt (Existing) */}
          <div>
             <h3 className="text-sm font-semibold mb-2 text-gray-700">ペルソナ別感情 (一部抜粋)</h3>
             <ul className="space-y-2">
               {sentimentData.slice(0, 5).map((p) => (
                 <li key={p.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-100">
                   <span className="font-medium text-gray-800 truncate pr-2">{p.name}</span>
                    <Badge variant={p.category === 'positive' ? 'default' : p.category === 'negative' ? 'destructive' : 'secondary'} className={`capitalize text-xs px-1.5 py-0.5 ${p.category === 'positive' ? 'bg-green-100 text-green-800 border-green-200' : p.category === 'negative' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {p.category}
                    </Badge>
                 </li>
               ))}
                {totalPersonas > 5 && <li className="text-xs text-gray-400 text-center pt-1">...他 {totalPersonas - 5} 件</li>}
             </ul>
          </div>
       </div>
     );
   } else if (analysisType === 'キーワード抽出') {
     // ... Keyword Extraction logic (Unchanged) ...
     const allWords = personas.flatMap(p => (p.response + ' ' + p.details).split(/[\s.,!?;:()"'\d]+/)) 
         .map(word => word.toLowerCase())
         .filter(word => word && word.length > 2 && !['the', 'a', 'is', 'to', 'in', 'it', 'of', 'and', 'for', 'on', 'with', 'as', 'i', 'that', 'this'].includes(word)); 
     const wordCounts = allWords.reduce((acc, word) => {
         acc[word] = (acc[word] || 0) + 1;
         return acc;
     }, {} as Record<string, number>);
     const topKeywords = Object.entries(wordCounts)
         .sort(([, a], [, b]) => b - a)
         .slice(0, 20); 

     content = (
       <div>
         <h3 className="text-base font-semibold mb-3 text-gray-700">主要キーワード (上位{topKeywords.length}件)</h3>
         {topKeywords.length > 0 ? (
           <div className="flex flex-wrap gap-2">
             {topKeywords.map(([word, count]) => (
               <Badge key={word} variant="outline" className="px-3 py-1 text-sm font-medium bg-white border-gray-300 text-gray-700 shadow-xs hover:bg-gray-50">
                 {word} <span className="ml-1.5 text-gray-400 font-normal">({count})</span>
               </Badge>
             ))}
           </div>
         ) : (
           <p className="text-gray-500 text-sm">キーワードを抽出できませんでした。</p>
         )}
       </div>
     );
   }

   return (
     <div className="h-full overflow-auto bg-white p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            {analysisType === '感情分析' ? <Smile className="w-6 h-6 text-gray-500"/> : <Tags className="w-6 h-6 text-gray-500"/>} 
            <h2 className="text-xl font-semibold text-gray-800">{analysisType} 結果</h2>
          </div>
           {personas.length > 0 && (
              <Button variant="outline" size="sm" onClick={onViewPersonaList} className="flex items-center gap-1.5">
                 <List className="w-3.5 h-3.5" /> ペルソナ一覧へ
              </Button>
           )}
        </div>
       <div className="bg-gray-50/50 p-5 rounded-lg border border-gray-200 shadow-inner">
         {content}
       </div>
     </div>
   );
};

interface PersonaListViewProps {
  personas: AIPersona[];
  onSelectPersona: (id: string) => void; // For navigating to detail view
  onBackToDashboard: () => void;
  selectedPersonaIds: string[];
  onPersonaSelectionChange: (personaId: string, isSelected: boolean) => void;
  // ★ Props for select all functionality
  onToggleSelectAll: () => void;
  isAllSelected: boolean;
}

const PersonaListView: React.FC<PersonaListViewProps> = ({
  personas,
  onSelectPersona,
  onBackToDashboard,
  selectedPersonaIds,
  onPersonaSelectionChange,
  onToggleSelectAll,
  isAllSelected,
}) => {
  const selectedCount = selectedPersonaIds.length;

  return (
    <div className="h-full overflow-auto bg-white p-6 md:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-800">
            生成されたペルソナ ({personas.length}人)
            {selectedCount > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({selectedCount}人選択中)</span>}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={onBackToDashboard} className="flex items-center gap-1.5">
             <BarChart3 className="w-3.5 h-3.5" /> ダッシュボードへ戻る
        </Button>
      </div>
      {personas.length > 0 ? (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-[50px] px-4 py-3">
                  {personas.length > 0 && ( // Only show if there are personas
                    <Checkbox
                      id="select-all-personas"
                      checked={isAllSelected}
                      onCheckedChange={onToggleSelectAll}
                      aria-label="すべてのペルソナを選択/選択解除"
                      className="border border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                  )}
                </TableHead>
                <TableHead className="w-[200px] px-4 py-3 text-sm font-medium text-gray-600">名前</TableHead>
                <TableHead className="px-4 py-3 text-sm font-medium text-gray-600">詳細 (抜粋)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map((persona) => (
                <TableRow
                   key={persona.id}
                   // ★ onClick for row navigates to detail, consider moving to a specific element like name if checkbox interferes
                   // For now, let's see if checkbox stopPropagation is enough
                   className="hover:bg-gray-50 transition-colors"
                 >
                  <TableCell className="px-4 py-3 align-top">
                    <Checkbox
                      id={`select-persona-${persona.id}`}
                      checked={selectedPersonaIds.includes(persona.id)}
                      onCheckedChange={(checked) => {
                        onPersonaSelectionChange(persona.id, !!checked);
                      }}
                      onClick={(e) => e.stopPropagation()} // Prevent row click when clicking checkbox
                      aria-labelledby={`persona-name-${persona.id}`}
                      // ★ Add border to checkbox
                      className="border border-gray-300 dark:border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    />
                  </TableCell>
                  <TableCell 
                    className="font-medium px-4 py-3 align-top w-[200px] text-gray-900 cursor-pointer"
                    onClick={() => onSelectPersona(persona.id)} // Make name clickable for detail view
                    id={`persona-name-${persona.id}`}
                  >
                    {persona.name}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 px-4 py-3 align-top line-clamp-2">{persona.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-16">ペルソナデータがありません。</p>
      )}
    </div>
  );
};

interface PersonaDetailViewProps {
  persona: AIPersona | null;
  onBackToList: () => void;
  // ★ Add onSaveChanges prop for future DB integration
  onSaveChanges?: (updatedPersona: AIPersona) => void; 
}

const PersonaDetailView: React.FC<PersonaDetailViewProps> = ({ persona, onBackToList, onSaveChanges }) => {
  const [isEditing, setIsEditing] = useState(false);
  // ★ Add state for editable fields
  const [editableName, setEditableName] = useState(persona?.name || "");
  const [editableDetails, setEditableDetails] = useState(persona?.details || "");
  const [editableResponse, setEditableResponse] = useState(persona?.response || "");

  // ★ Effect to update editable fields when persona prop changes
  useEffect(() => {
    if (persona) {
      setEditableName(persona.name);
      setEditableDetails(persona.details);
      setEditableResponse(persona.response);
    }
  }, [persona]);

  if (!persona) {
    return (
      <div className="p-8 text-center text-gray-500">
        ペルソナが選択されていません。
        <Button variant="link" onClick={onBackToList}>リストに戻る</Button>
      </div>
    );
  }

  const handleSave = () => {
    // ★ In a real app, call onSaveChanges here
    if (onSaveChanges) {
        onSaveChanges({
            ...persona, // Spread existing persona data
            id: persona.id, // Ensure ID is passed
            name: editableName,
            details: editableDetails,
            response: editableResponse,
        });
    }
    console.log("Saved (mock):", { name: editableName, details: editableDetails, response: editableResponse });
    setIsEditing(false);
  };

  const handleCancel = () => {
    // Reset editable fields to original persona data
    if (persona) {
        setEditableName(persona.name);
        setEditableDetails(persona.details);
        setEditableResponse(persona.response);
    }
    setIsEditing(false);
  };

  return (
    <div className="h-full overflow-auto bg-white p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
       <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
         {isEditing ? (
            <Input 
                value={editableName}
                onChange={(e) => setEditableName(e.target.value)}
                className="text-xl font-semibold text-gray-900 bg-white border-b-2 border-gray-300 focus:border-gray-500 transition-colors duration-200 py-1 px-2 rounded-sm"
            />
         ) : (
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
                    {persona.name.charAt(0).toUpperCase()}
                </div>
                 {/* ★ Ensure persona name is dark */}
                <h2 className="text-xl font-semibold text-gray-900">{persona.name}</h2>
            </div>
         )}
         <div className="flex items-center gap-2">
           {/* ★ Hide "リストへ戻る" button when editing */}
           {!isEditing && <Button variant="outline" size="sm" onClick={onBackToList}>リストへ戻る</Button>}
           {isEditing ? (
            <>
                <Button variant="ghost" size="sm" onClick={handleCancel} className="bg-gray-800 text-white hover:bg-gray-700">キャンセル</Button>
                <Button variant="default" size="sm" onClick={handleSave} className="bg-gray-700 hover:bg-gray-600 text-white">保存</Button>
            </>
           ) : (
             // ★ Add border to Edit button
             <Button variant="default" size="sm" onClick={() => setIsEditing(true)} className="border border-gray-700 hover:bg-gray-100 hover:text-gray-900">
               <Edit3 className="w-3.5 h-3.5 mr-1.5" />
               編集
             </Button>
           )}
         </div>
       </div>

      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardHeader>
          {/* ★ Ensure title text is dark */}
          <CardTitle className="text-base font-semibold text-gray-900">ペルソナ詳細</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
             <Textarea 
                value={editableDetails} 
                onChange={(e) => setEditableDetails(e.target.value)} 
                rows={8}
                // ★ Ensure black text for textarea
                className="w-full text-sm text-gray-900 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
            />
           ) : (
             // ★ Ensure content text is dark
             <p className="text-sm text-gray-900 whitespace-pre-wrap p-1">{persona.details}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardHeader>
           {/* ★ Ensure title text is dark */}
          <CardTitle className="text-base font-semibold text-gray-900">AIの応答 (初期リクエストに対して)</CardTitle>
        </CardHeader>
        <CardContent>
           {isEditing ? (
             <Textarea 
                value={editableResponse} 
                onChange={(e) => setEditableResponse(e.target.value)} 
                rows={10}
                // ★ Ensure black text for textarea
                className="w-full text-sm text-gray-900 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none"
            />
           ) : (
             // ★ Ensure content text is dark
             <p className="text-sm text-gray-900 whitespace-pre-wrap p-1">{persona.response}</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

// General loading messages
const loadingMessages = [
  "ちょっと待ってね、AIが最高のアイデアを練ってるから！✨",
  "ペルソナたちと作戦会議中... 秘密だけどね！🤫",
  "思考回路をフル回転！煙が出ちゃうかも？煙",
  "データの大海原を探索中... 面白いもの見つかるかな？🧭",
  "創造力をブースト中！エネルギー充填120%！🚀",
  "AIもおやつタイム♪ しばしお待ちを... 🍪",
  "未来のユーザー像を想像中... ワクワクするね！💭",
  "最適なペルソナを厳選しています... 少々お待ちください！👓",
];

// ★ Persona generation specific loading messages
const generatingMessages = [
  "ペルソナの魂を鋳造中... 🔥",
  "個性と経験をブレンドしています... 🧪",
  "AIが想像力を解き放ちます！💫",
  "デジタル世界の新しい住人を生成中... 👤",
  "ユニークな視点を構築しています... 🧩",
  "創造の火花が散っています！✨",
  "もうすぐ個性豊かなペルソナが完成します！⏳",
];

// ★ Import the new relationship diagram view
import PersonaRelationshipDiagramView from './views/PersonaRelationshipDiagramView';
import { type Node as ReactFlowNode } from 'reactflow'; // Import React Flow Node type
import { type PersonaNodeData } from '../../features/persona/utils/relationshipUtils'; // Import PersonaNodeData

// ★ Import the new action suggestions view and utility
import ActionSuggestionsView from './views/ActionSuggestionsView';
import { generateMockActionSuggestions, type ActionSuggestion } from '../../features/feedback/utils/suggestionUtils';

const DynamicContentArea: React.FC<DynamicContentAreaProps> = ({
  currentView,
  isLoading,
  onSubmitRequest,
  experts, // 受け取る
  proposalSummary, // 受け取る
  userRequestForConfirmation,
  aiSuggestion,
  onSettingsChange,
  analysisType,
  selectedPersonaId,
  onSelectPersona,
  onBackToList,
  onBackToDashboard,
  onViewPersonaList,
  onPersonaUpdate,
  selectedPersonaIdsForQuery,
  onPersonaSelectionChange,
  onToggleSelectAllPersonasInList,
  isAllPersonasInListSelected,
  onRelationshipNodeClick, // ★ Destructure new prop
}) => {
  const variants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
  };

  // ★ Variant for loading text exit animation
  const loadingExitVariant = {
    opacity: 0,
    scale: 0.85, // Shrink a bit more
    y: 5,       // Move slightly down
    transition: { duration: 0.3, ease: "easeIn" } // Faster exit
  };

  const selectedPersona = experts.find(p => p.id === selectedPersonaId);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }
    console.log(`[Debug] View changed to: ${currentView}, isLoading: ${isLoading}`);

    // ★ Only apply transition effect for non-generating views
    if (currentView !== 'generating' && !isLoading) {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
        console.log("[Debug] Setting isTransitioning to true");
        setIsTransitioning(true);
        transitionTimeoutRef.current = setTimeout(() => {
            console.log("[Debug] Setting isTransitioning to false");
            setIsTransitioning(false);
            transitionTimeoutRef.current = null;
        }, 2000);
    } else {
        // Reset transition state if moving to generating or if loading
        setIsTransitioning(false); 
        console.log("[Debug] Not setting isTransitioning");
    }

    return () => {
        if (transitionTimeoutRef.current) {
            clearTimeout(transitionTimeoutRef.current);
        }
    };
  }, [currentView]);

  // ★ Updated renderViewContent to handle generating state separately
  const renderViewContent = () => {
    if (currentView === 'generating') {
      const randomIndex = Math.floor(Math.random() * generatingMessages.length);
      return (
        // ★ Wrap Generating TextShimmerWave in a centering div
        <div className="absolute inset-0 flex items-center justify-center">
            <TextShimmerWave
              className="text-xl font-semibold [--base-color:#6366F1] [--base-gradient-color:#A78BFA]"
            >
              {generatingMessages[randomIndex]}
            </TextShimmerWave>
        </div>
      );
    }

    if (isTransitioning) {
        return (
           // ★ Wrap Transition TextShimmerWave in a centering div
           <div className="absolute inset-0 flex items-center justify-center">
              <TextShimmerWave
                  className="text-xl font-semibold [--base-color:#0D74CE] [--base-gradient-color:#5EB1EF]"
              >
                  {loadingMessage}
              </TextShimmerWave>
            </div>
        );
    }

    // Otherwise, render the actual view content
    switch (currentView) {
      case 'initial': return <WelcomeView />;
      case 'request_input': return <RequestInputView onSubmit={onSubmitRequest} />;
      case 'confirmation': return aiSuggestion && userRequestForConfirmation ? <ConfirmationView userRequest={userRequestForConfirmation} suggestion={aiSuggestion} onSettingsChange={onSettingsChange} /> : null;
      case 'results_dashboard': return <ResultsDashboardView experts={experts} summary={proposalSummary} onViewPersonaList={onViewPersonaList} />;
      case 'analysis_result': return analysisType ? <AnalysisResultView analysisType={analysisType} personas={experts} onViewPersonaList={onViewPersonaList} /> : null;
      case 'persona_list': 
        return <PersonaListView 
                  personas={experts} 
                  onSelectPersona={onSelectPersona} 
                  onBackToDashboard={onBackToDashboard}
                  selectedPersonaIds={selectedPersonaIdsForQuery}
                  onPersonaSelectionChange={onPersonaSelectionChange}
                  onToggleSelectAll={onToggleSelectAllPersonasInList}
                  isAllSelected={isAllPersonasInListSelected}
              />;
      case 'persona_detail': 
          return <PersonaDetailView 
                      persona={selectedPersona ?? null} 
                      onBackToList={onBackToList} 
                      onSaveChanges={onPersonaUpdate}
                  />;
      case 'relationship_diagram':
        return <PersonaRelationshipDiagramView 
                  personas={experts} 
                  onNodeClick={(_event: React.MouseEvent, node: ReactFlowNode<PersonaNodeData>) => onRelationshipNodeClick(node.id)}
                />;
      case 'action_suggestions':
        const dummySuggestions: ActionSuggestion[] = [
          { id: 'sugg1', category: 'UI/UX改善', title: 'ナビゲーションの改善', description: 'グローバルナビゲーションの項目を見直し、より直感的な操作を可能にします。', estimatedImpact: '中', requiredEffort: '中', relevantPersonaIds: experts.length > 0 ? [experts[0].id] : [] },
          { id: 'sugg2', category: '機能追加', title: '検索機能の強化', description: '高度なフィルタリングオプションを追加し、目的の情報へ素早くアクセスできるようにします。', estimatedImpact: '中', requiredEffort: '中', relevantPersonaIds: experts.length > 1 ? [experts[1].id] : [] },
        ];
        const currentPersonasMap = new Map(experts.map(p => [p.id, p]));
        return <ActionSuggestionsView 
                 suggestions={dummySuggestions} 
                 personasMap={currentPersonasMap} 
                 onViewPersona={onRelationshipNodeClick} // 既存のハンドラーを流用 (詳細表示用)
                 onBack={onBackToDashboard} // 既存のハンドラーを流用
               />;
      case 'error': return <ErrorView />;
      default: return null;
    }
  };

  return (
    <div 
      // ★ Add h-full to ensure it takes the full height of its ResizablePanel
      className="flex-grow overflow-hidden bg-white relative h-full" 
      style={{
        maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
      }}
    >
      {/* ★ Ensure this div also takes full height for proper scroll and padding */}
      <div className="absolute inset-0 overflow-auto pb-10 h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (currentView === 'analysis_result' ? analysisType : '') + (currentView === 'persona_detail' ? selectedPersonaId : '')} 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="h-full" 
          >
            {renderViewContent()} 
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- メインページコンポーネント --- 
export function PersonaSimulationPage() {
  // ストアから状態とアクションを取得
  const {
    experts, // 新しく追加
    setExperts, // 新しく追加
    proposalSummary, // 新しく追加
    setProposalSummary, // 新しく追加
    currentView,
    setCurrentView,
    // ... (他のストアの状態/アクション)
  } = useSimulationStore();

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultSets, setResultSets] = useState<ResultSet[]>([]); 
  const [displayedResultSetIndex, setDisplayedResultSetIndex] = useState<number>(0);
  const [currentRequest, setCurrentRequest] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [currentSettings, setCurrentSettings] = useState<{ count: number; level: DetailLevel } | null>(null);
  const [currentAnalysisType, setCurrentAnalysisType] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null); // For detail view
  const [viewBeforeList, setViewBeforeList] = useState<SimulationView>('results_dashboard');
  const navigate = useNavigate(); // ★ Initialize useNavigate
  const [isPersonaGenerated, setIsPersonaGenerated] = useState(false); // ★ ペルソナ生成済みかを管理するフラグ

  // ★ State for selected persona IDs for querying
  const [selectedPersonaIdsForQuery, setSelectedPersonaIdsForQuery] = useState<string[]>([]);

  useEffect(() => {
    setChatHistory([
      { id: 'sys-' + Date.now(), role: 'system', content: 'シミュレーションを開始します。下の入力欄に要望を入力してください。' }
    ]);
    setCurrentView('initial');
  }, []);

  const handleSettingsChange = (newSettings: { count: number; level: DetailLevel }) => {
    setCurrentSettings(newSettings);
  };

  // --- Navigation Handlers ---
  const handleViewPersonaList = () => {
    setViewBeforeList(currentView);
    setCurrentView('persona_list');
  };

  const handleSelectPersona = (id: string) => {
    setSelectedPersonaId(id);
    setCurrentView('persona_detail');
  };

  const handleBackToList = () => {
    setSelectedPersonaId(null);
    setCurrentView('persona_list');
  };

  const handleBackToDashboard = () => {
    setCurrentView(viewBeforeList); // This could be 'results_dashboard' or wherever the user was before list/detail
  };

  // ★ Handler for persona selection for querying
  const handlePersonaSelectionForQuery = (personaId: string, isSelected: boolean) => {
    setSelectedPersonaIdsForQuery(prevSelectedIds => {
      if (isSelected) {
        // Add ID if not already present
        return prevSelectedIds.includes(personaId) ? prevSelectedIds : [...prevSelectedIds, personaId];
      } else {
        // Remove ID
        return prevSelectedIds.filter(id => id !== personaId);
      }
    });
  };

  // Helper function to prevent adding duplicate messages by ID
  const addUniqueMessage = (history: ChatMessage[], newMessage: ChatMessage): ChatMessage[] => {
      if (history.some(msg => msg.id === newMessage.id)) {
          console.warn(`Attempted to add duplicate message ID: ${newMessage.id}`);
          return history;
      }
      return [...history, newMessage];
  };

  // ★ Updated handleSendMessage
  const handleSendMessage = async (
      message: string,
      modeOrAction: 'normal' | 'persona_question' | `Action: ${string}` = 'normal',
      payload: any = null
  ) => {
    const isActionClick = typeof modeOrAction === 'string' && modeOrAction.startsWith('Action:');
    const currentMode = isActionClick ? 'normal' : modeOrAction;

    console.log(`handleSendMessage called. isLoading: ${isLoading}, message: ${message}, mode/action: ${modeOrAction}, payload: ${JSON.stringify(payload)}`);
    // Allow system internal messages or non-loading actions to proceed
    if (isLoading && !(currentMode === 'persona_question' && message.startsWith('[System Internal]')) && !isActionClick) { 
        console.warn("Attempted to send message while already loading. Aborting.");
        return; 
    }
    setIsLoading(true);
    console.log("isLoading set to true for general processing or start of new message send");
    const messageTimestamp = Date.now();
    let aiResponse: ChatMessage | null = null;
    let nextView: SimulationView = currentView;
    const aiResponseId = `ai-${messageTimestamp}`;
    let viewChangedInternally = false;

    if (!isActionClick) {
      let userMessageContent = message;
      if (currentMode === 'persona_question') {
        if (selectedPersonaIdsForQuery.length > 0) {
          const personasInCurrentSet = resultSets[displayedResultSetIndex]?.personas || [];
          const selectedPersonas = personasInCurrentSet.filter(p => selectedPersonaIdsForQuery.includes(p.id));
          if (selectedPersonas.length > 0) {
            const selectedPersonaNames = selectedPersonas.map(p => p.name).join(', ');
            userMessageContent = `[ペルソナへの質問: ${selectedPersonaNames}へ]\n${message}`;
          } else {
            // This case should ideally not be hit if selectedPersonaIdsForQuery is populated from the current set.
            // However, as a fallback or if data is stale:
            const noPersonaFoundErrorMsg: ChatMessage = {
              id: `sys-error-nopersona-${messageTimestamp}`,
              role: 'system',
              content: '選択されたIDに一致するペルソナが現在の結果セットにいません。表示を更新するか、選択を確認してください。'
            };
            setChatHistory(prev => addUniqueMessage(prev, noPersonaFoundErrorMsg));
            setIsLoading(false);
            console.log("isLoading set to false due to no selected personas found in current set for query");
            return; 
          }
        } else {
          const noPersonaSelectedErrorMsg: ChatMessage = {
            id: `sys-error-noselection-${messageTimestamp}`,
            role: 'system',
            content: '質問対象のペルソナが選択されていません。ペルソナ一覧から対象を選択してください。'
          };
          setChatHistory(prev => addUniqueMessage(prev, noPersonaSelectedErrorMsg));
          setIsLoading(false);
          console.log("isLoading set to false due to no personas selected for query");
          return; 
        }
      }
      const newUserMessage: ChatMessage = { id: `user-${messageTimestamp}`, role: 'user', content: userMessageContent };
      console.log("Adding user message:", newUserMessage.id);
      setChatHistory(prev => addUniqueMessage(prev, newUserMessage));
    } else {
        console.log(`Action Triggered: ${modeOrAction} (Timestamp: ${messageTimestamp}) with payload:`, payload);
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Short delay for state update
      console.log(`Processing logic. Current View was: ${currentView}, Message: ${message}, Mode/Action: ${modeOrAction}`);

      // --- BRANCH 1: Handle ALL Actions --- 
      if (isActionClick) {
          const action = modeOrAction.split(': ')[1].trim();
          console.log(`[Action Branch] Processing action: ${action}`);

          // Helper functions (keep existing ones)
          const handleAnalysisAction = (analysisType: string, personasPayload: AIPersona[]) => { handleSendMessage(analysisType, `Action: ${analysisType} を実行`, { personas: personasPayload }); };
          const handleViewListAction = () => { handleSendMessage('View Persona List', 'Action: View Persona List'); };
          const handleViewRelationshipDiagram = () => {
            setViewBeforeList('results_dashboard'); 
            setCurrentView('relationship_diagram');
          };
          const handleViewActionSuggestions = () => {
            setViewBeforeList('results_dashboard'); 
            setCurrentView('action_suggestions');
          };

          // --- Action Handlers --- 
          if (action === 'Confirm Generation' && payload?.suggestion) {
            console.log("[Action Branch] Confirm Generation with suggestion:", payload.suggestion);

            // currentSettings ではなく payload.suggestion から設定値を取得
            const settingsFromPayload = {
                count: payload.suggestion.selectedPersonaCount,
                level: payload.suggestion.detailLevel,
                attributes: payload.suggestion.attributes, // 属性も取得
                requestContext: payload.suggestion.requestContext // 元のリクエストも取得
            };

            if (!settingsFromPayload.count || !settingsFromPayload.level) { // count が 0 の可能性も考慮
                aiResponse = { id: aiResponseId, role: 'ai', content: 'エラー: ペルソナ数または詳細度の設定が無効です。' };
                setIsLoading(false);
                console.log("isLoading set to false due to invalid settings in payload for Confirm Generation");
            } else {
                const generationStartMsg: ChatMessage = {
                    id: `sys-genstart-${messageTimestamp}`,
                    role: 'system',
                    content: `設定を承認しました。ペルソナ${settingsFromPayload.count}体 (詳細度: ${detailLevelLabels[settingsFromPayload.level]}) の生成を開始します...`,
                };
                setChatHistory(prev => addUniqueMessage(prev, generationStartMsg));

                setIsLoading(true);
                console.log("isLoading set to true for Confirm Generation");
                setCurrentView('generating');
                viewChangedInternally = true;

                setTimeout(() => {
                  try {
                    const personas: AIPersona[] = Array.from({ length: settingsFromPayload.count }).map((_, i) => ({
                        id: `persona-${Date.now()}-${i}`,
                        name: `ペルソナ ${i + 1} (${detailLevelLabels[settingsFromPayload.level]})`,
                        details: `これはペルソナ${i + 1}の詳細です。要望「${settingsFromPayload.requestContext?.substring(0,30) || 'N/A'}...」に基づいており、${settingsFromPayload.attributes}の特性を持ちます。詳細度は「${detailLevelLabels[settingsFromPayload.level]}」です。シミュレーションへの貢献が期待されます。`,
                        response: `要望「${settingsFromPayload.requestContext?.substring(0,30) || 'N/A'}...」に対するペルソナ${i + 1}の初期回答です。私の視点では... (ダミー応答)`
                    }));

                    const newResultSet: ResultSet = {
                        id: `rs-${Date.now()}`,
                        title: `初期結果 (${settingsFromPayload.count}人)`,
                        personas: personas,
                    };
                    setResultSets(prev => {
                        const newSets = [...prev, newResultSet];
                        setDisplayedResultSetIndex(newSets.length - 1); // 新しいセットのインデックスは newSets.length - 1
                        setIsPersonaGenerated(true); // ★ ペルソナ生成完了フラグを立てる
                        return newSets;
                    });

                    const aiResponseAfterGeneration: ChatMessage = {
                        id: `ai-gencomplete-${messageTimestamp}`,
                        role: 'ai',
                        content: `${personas.length}人のペルソナ生成が完了しました。結果ダッシュボードを表示します。\n分析オプションを選択してください。`,
                        actions: [
                            { id: 'act-sentiment', label: '感情分析を実行', onClick: () => handleAnalysisAction('感情分析', personas) },
                            { id: 'act-keyword', label: 'キーワード抽出を実行', onClick: () => handleAnalysisAction('キーワード抽出', personas) },
                            { id: 'act-view-list', label: 'ペルソナ一覧を見る', onClick: handleViewListAction },
                            { id: 'act-view-rel-diag', label: '関係図を見る', onClick: handleViewRelationshipDiagram },
                            { id: 'act-view-action-sugg', label: '改善アクション提案を見る', onClick: handleViewActionSuggestions },
                        ],
                        canDeepDive: true,
                    };
                    setChatHistory(prev => addUniqueMessage(prev, aiResponseAfterGeneration));
                    setCurrentView('results_dashboard');
                  } catch (error) {
                    console.error("Error during persona generation in setTimeout:", error);
                    const errorMsg: ChatMessage = {
                        id: `err-gen-${Date.now()}`,
                        role: 'system',
                        content: 'ペルソナ生成中に内部エラーが発生しました。'
                    };
                    setChatHistory(prev => addUniqueMessage(prev, errorMsg));
                    setCurrentView('error');
                  } finally {
                    setIsLoading(false);
                    console.log("isLoading set to false after generation attempt in Confirm Generation (finally block of setTimeout)");
                  }
                }, 2500 + Math.random() * 1000);
            }
          } else if (action === 'Request Modification') {
            // ... (existing Request Modification logic) ...
            // ここにも setIsLoading(false) が必要になる可能性あり
            setIsLoading(false); // 仮で追加
          } else if (action === '感情分析 を実行' && payload?.personas) {
            console.log("[Action Branch] 感情分析 を実行 with personas:", payload.personas);
            if (payload.personas && payload.personas.length > 0) {
                setCurrentAnalysisType('感情分析');
                aiResponse = { id: aiResponseId, role: 'system', content: '感情分析結果を表示します。' };
                nextView = 'analysis_result'; 
                viewChangedInternally = true; 
                setCurrentView('analysis_result'); 
            } else {
                aiResponse = { id: aiResponseId, role: 'ai', content: '分析対象のペルソナがいません。' };
                nextView = currentView;
            }
            setIsLoading(false);
          } else if (action === 'キーワード抽出 を実行' && payload?.personas) {
            console.log("[Action Branch] キーワード抽出 を実行 with personas:", payload.personas);
            if (payload.personas && payload.personas.length > 0) {
                setCurrentAnalysisType('キーワード抽出');
                aiResponse = { id: aiResponseId, role: 'system', content: 'キーワード抽出結果を表示します。' };
                nextView = 'analysis_result';
                viewChangedInternally = true;
                setCurrentView('analysis_result');
            } else {
                aiResponse = { id: aiResponseId, role: 'ai', content: '分析対象のペルソナがいません。' };
                nextView = currentView;
            }
            setIsLoading(false);
          } else if (action === 'View Persona List') {
              console.log("[Action Branch] View Persona List");
              if (resultSets.length > 0 && resultSets[displayedResultSetIndex]?.personas.length > 0) {
                  aiResponse = { id: `sys-view-list-${messageTimestamp}`, role: 'system', content: `ペルソナ一覧を表示します。` }; 
                  // handleViewPersonaList(); // setCurrentView を直接呼び出すため、これは不要になるか、setCurrentView のみを担当する
                  setViewBeforeList(currentView); // 保存
                  setCurrentView('persona_list');
                  nextView = 'persona_list'; // nextView も更新
                  viewChangedInternally = true;
              } else {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `表示するペルソナリストがありません。先にペルソナを生成してください。` };
                  nextView = currentView;
              }
              setIsLoading(false); // ★ Add this line
          } else if (action === 'View Relationship Diagram') {
              console.log("[Action Branch] View Relationship Diagram");
              if (resultSets.length > 0 && resultSets[displayedResultSetIndex]?.personas.length > 0) {
                 aiResponse = { id: `sys-view-rel-${messageTimestamp}`, role: 'system', content: `ペルソナ関係図を表示します。` }; 
                 // handleViewRelationshipDiagram(); // setCurrentView を直接呼び出す
                 setViewBeforeList(currentView);
                 setCurrentView('relationship_diagram');
                 nextView = 'relationship_diagram'; // nextView も更新
                 viewChangedInternally = true;
              } else {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `関係図を表示するペルソナがいません。` };
                  nextView = currentView;
              }
              setIsLoading(false); // ★ Add this line
          } else if (action === 'View Action Suggestions') {
              console.log("[Action Branch] View Action Suggestions");
              if (resultSets.length > 0 && resultSets[displayedResultSetIndex]?.personas.length > 0) {
                 aiResponse = { id: `sys-view-sugg-${messageTimestamp}`, role: 'system', content: `改善アクション提案を表示します。` }; 
                 // handleViewActionSuggestions(); // setCurrentView を直接呼び出す
                 setViewBeforeList(currentView);
                 setCurrentView('action_suggestions');
                 nextView = 'action_suggestions'; // nextView も更新
                 viewChangedInternally = true;
              } else {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `改善提案の元となるペルソナがいません。` };
                  nextView = currentView;
              }
              setIsLoading(false); // ★ Add this line
          // ★ Add handler for Deep Dive request
          } else if (action === 'Request Deep Dive' && payload?.targetMessageId) {
              console.log(`[Action Branch] Request Deep Dive for message ID: ${payload.targetMessageId}`);
              const targetMsgContent = payload.originalContent || ""; // Get original content from payload
              
              // Add a system message indicating the deep dive is starting
              const deepDiveStartMsg: ChatMessage = {
                  id: `sys-deepdive-${messageTimestamp}`,
                  role: 'system',
                  content: `「${targetMsgContent.substring(0, 50)}${targetMsgContent.length > 50 ? '...' : ''}」について、さらに深掘りします...`,
              };
              setChatHistory(prev => addUniqueMessage(prev, deepDiveStartMsg));
              
              // --- Simulate AI generating a deeper response --- 
              await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 800)); // Simulate thinking time
              
              // Mock deep dive response based on original content
              let deepDiveResponseContent = `[深掘り結果]
先ほどの「${targetMsgContent.substring(0, 30)}${targetMsgContent.length > 30 ? '...' : ''}」という点についてですが、これは具体的には...`;
              if (targetMsgContent.toLowerCase().includes('使いにくい') || targetMsgContent.toLowerCase().includes('難しい')) {
                  deepDiveResponseContent += "\nユーザーが特定の操作フローで混乱している可能性が考えられます。例えば、〇〇の画面遷移が直感的でない、あるいは△△のボタンの意味が理解しにくい、といった点が挙げられます。";
              } else if (targetMsgContent.toLowerCase().includes('良い') || targetMsgContent.toLowerCase().includes('便利')) {
                  deepDiveResponseContent += "\n特に〇〇の機能がユーザーのニーズに合致しており、タスク達成に貢献しているようです。この点はプロダクトの強みとして認識すべきでしょう。";
              } else {
                  deepDiveResponseContent += "\nユーザーがなぜそのように感じたのか、さらに背景を探る必要がありそうです。（現時点では定型的な深掘り応答です）";
              }

              aiResponse = {
                  id: aiResponseId,
                  role: 'ai',
                  content: deepDiveResponseContent,
                  // Optionally, disable further deep dive on this response
                  // canDeepDive: false, 
              };
              nextView = currentView; // Stay in the current view
              setIsLoading(false); // Set loading false after response is generated
          } else {
              // ... (existing unknown action handler) ...
          }
      // --- BRANCH 2: Handle Non-Action Messages ... (existing logic remains) ...
      } else if (!isActionClick) {
          console.log(`[Message Branch] Processing mode: ${currentMode}`);
          // currentMode が 'normal' の場合にバックエンドAPIを呼び出す
          if (currentMode === 'normal') {
            console.log("[Message Branch] Mode is 'normal'. Calling backend API...");
            try {
              const response = await fetch('/api/generate-expert-proposal', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                  messages: [{ role: 'user', content: message }] // ユーザーの最新メッセージのみ送信
                }),
              });

              if (!response.ok) {
                // エラーレスポンスを処理
                const errorData = await response.json();
                console.error("API Error:", errorData);
                aiResponse = {
                  id: aiResponseId,
                  role: 'ai',
                  content: `エラーが発生しました: ${errorData.message || response.statusText}`,
                };
              } else {
                // 成功レスポンスを処理
                const expertProposal: ExpertProposal = await response.json(); // 型を適用
                console.log("API Success:", expertProposal);

                // --- ここからストア更新とビュー切り替え --- 
                // 1. ストアに結果を保存
                //    注意: バックエンドの expert 型とフロントの AIPersona 型の差異を吸収する必要あり
                //    ここでは仮にそのままセットするが、実際には変換が必要な場合あり
                setExperts(expertProposal.experts as AIPersona[]); // 型アサーションで一旦対応
                setProposalSummary(expertProposal.summary);

                // 2. 表示ビューを切り替え
                setCurrentView('results_dashboard'); // ダッシュボード表示に切り替え
                viewChangedInternally = true; // ビューが内部で変更されたフラグ
                // --- ここまでストア更新とビュー切り替え --- 

                // --- 会話形式で履歴を構築 ---
                const orchestratorStartMsg: ChatMessage = {
                  id: `orchestrator-start-${aiResponseId}`,
                  role: 'orchestrator',
                  speaker: 'オーケストレーター',
                  content: `専門家会議を開始します。${expertProposal.summary.persona_count}名の専門家が参加します。順にご意見を伺います。`
                };

                const personaMsgs: ChatMessage[] = (expertProposal.experts as any[]).map((exp, idx) => ({
                  id: `persona-${exp.id}`,
                  role: 'persona',
                  speaker: exp.name,
                  content: exp.answer
                }));

                const orchestratorSummaryMsg: ChatMessage = {
                  id: `orchestrator-summary-${aiResponseId}`,
                  role: 'orchestrator',
                  speaker: 'オーケストレーター',
                  content: `以上、${expertProposal.summary.persona_count}名の意見をまとめました。主なポイント: ${expertProposal.summary.main_attributes}`
                };

                setChatHistory(prev => [
                  ...prev,
                  orchestratorStartMsg,
                  ...personaMsgs,
                  orchestratorSummaryMsg
                ]);

                // 旧aiResponseの履歴追加は不要
                // ... existing code ...

                // 応答メッセージを生成 (仮)
                aiResponse = {
                  id: aiResponseId,
                  role: 'ai',
                  content: `${expertProposal.summary.persona_count}人の専門家候補が見つかりました。結果を表示します。`,
                  // 必要に応じて actions を追加
                };
              }
            } catch (error) { 
              // ... (Fetchエラー処理)
            }
          } else if (currentMode === 'persona_question') {
            // ペルソナへの質問の場合 (既存のダミーロジックまたは将来の拡張)
            console.log("[Message Branch] Mode is 'persona_question'. Handling persona query...");
            // ダミー応答 (既存のロジックがあればそれを維持)
            aiResponse = {
              id: aiResponseId,
              role: 'ai',
              content: `[${selectedPersonaIdsForQuery.join(', ')}] への質問「${message}」に対するダミー応答です。`,
            };
          }

          // AI応答があればチャット履歴に追加
          if (aiResponse) {
            console.log("Adding AI response message:", aiResponse.id);
            setChatHistory(prev => addUniqueMessage(prev, aiResponse!));
          }
          // 通常メッセージ/ペルソナ質問処理後に isLoading を解除
          setIsLoading(false);
          console.log("[Message Branch] isLoading set to false after processing message.");
      }

    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorMsg: ChatMessage = {
        id: `error-${messageTimestamp}`,
        role: 'system',
        content: `メッセージ処理中に予期せぬエラーが発生しました: ${error}`
      };
      setChatHistory(prev => addUniqueMessage(prev, errorMsg));
      setIsLoading(false); // Ensure loading is reset on unexpected error
      console.log("isLoading set to false due to unexpected error in handleSendMessage");
    } finally {
      // Ensure isLoading is always reset unless a view change happened that handles it elsewhere
      // (e.g., the generation timeout in Confirm Generation)
      // Note: The logic inside branches might have already set isLoading to false.
      // This finally block acts as a safeguard, but might be redundant if branches handle it perfectly.
      // Let's refine this: Only reset if it wasn't reset by a specific branch AND no internal view change expects loading.
      // This logic gets complex quickly. Simpler approach: Each branch MUST reset isLoading.
      // The Confirm Generation action with setTimeout is the tricky one.
      // Let's rely on branches setting it, and remove this potentially problematic finally block reset.
      // console.log(`Finally block reached. isLoading is currently: ${isLoading}`);
      // if (isLoading && !viewChangedInternally) { // Basic safeguard attempt
      //   setIsLoading(false);
      //   console.log("isLoading reset in finally block as a safeguard.");
      // }
    }
  };

  // Initial request submission (no changes needed here)
  const handleSubmitInitialRequest = (request: string) => {
    handleSendMessage(request, 'normal'); // Explicitly pass 'normal' mode
  };

  // ★ Handler for updating a persona (mock)
  const handlePersonaUpdate = (updatedPersona: AIPersona) => {
    console.log("Persona updated (mock):", updatedPersona);
    // In a real app, you would update the persona in the resultSets state
    setResultSets(prevResultSets => {
        const newResultSets = [...prevResultSets];
        const currentSet = newResultSets[displayedResultSetIndex];
        if (currentSet) {
            const personaIndex = currentSet.personas.findIndex(p => p.id === updatedPersona.id);
            if (personaIndex !== -1) {
                currentSet.personas[personaIndex] = updatedPersona;
            }
        }
        return newResultSets;
    });
  };

  // ★ Handler for toggling select all personas for querying
  const handleToggleSelectAllPersonasForQuery = () => {
    const currentPersonasInView = resultSets[displayedResultSetIndex]?.personas || [];
    const allCurrentPersonaIds = currentPersonasInView.map(p => p.id);
    const allSelected = allCurrentPersonaIds.length > 0 && allCurrentPersonaIds.every(id => selectedPersonaIdsForQuery.includes(id));

    if (allSelected) {
      // If all are selected, deselect all currently displayed personas
      setSelectedPersonaIdsForQuery(prevSelectedIds => prevSelectedIds.filter(id => !allCurrentPersonaIds.includes(id)));
    } else {
      // If not all (or none) are selected, select all currently displayed personas (add only those not already selected)
      setSelectedPersonaIdsForQuery(prevSelectedIds => {
        const newIds = allCurrentPersonaIds.filter(id => !prevSelectedIds.includes(id));
        return [...prevSelectedIds, ...newIds];
      });
    }
  };

  const isAllDisplayedPersonasSelected = () => {
    const currentPersonasInView = resultSets[displayedResultSetIndex]?.personas || [];
    if (currentPersonasInView.length === 0) return false; // Nothing to be selected
    return currentPersonasInView.every(p => selectedPersonaIdsForQuery.includes(p.id));
  };

  // ★ Handler for node click in relationship diagram
  const handleRelationshipNodeClick = (nodeId: string) => {
    // Navigate to persona detail view when a node is clicked
    setSelectedPersonaId(nodeId);
    setViewBeforeList(currentView); // Save current view before going to detail
    setCurrentView('persona_detail');
  };

  // ★ Create a Map from personas array for efficient lookup
  const personasMap = useMemo(() => {
    const map = new Map<string, AIPersona>();
    const currentPersonas = resultSets[displayedResultSetIndex]?.personas || [];
    currentPersonas.forEach(persona => {
      map.set(persona.id, persona);
    });
    return map;
  }, [resultSets, displayedResultSetIndex]);

  // ★ Handler for tab navigation
  const handleTabChange = (view: SimulationView) => {
    // relationships_diagram や action_suggestions からダッシュボードやリストに戻る際は
    // viewBeforeList のようなものを考慮する必要があるかもしれないが、一旦直接遷移させる。
    setViewBeforeList(currentView); // 遷移前のビューを記録 (リストや詳細からの戻り先として)
    setCurrentView(view);
  };

  // ★ Handler for menu item navigation
  const handleMenuItemChange = (view: SimulationView) => {
    setViewBeforeList(currentView); 
    setCurrentView(view);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden relative">
      {/* 上部のタブ表示は削除 */}

      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
        {/* <ResizablePanel defaultSize={5} minSize={5} maxSize={5} className="flex-shrink-0">
             ここに以前 SimulationViewTabs を入れていたが、今回は空か別のヘッダー要素
        </ResizablePanel>
        <ResizableHandle withHandle className="border-0 bg-transparent" /> */} {/* 上部パネルがなければハンドルも不要かコメントアウト */} 
        <ResizablePanel defaultSize={65} minSize={30} className="min-h-0"> {/* defaultSizeを調整 (上部パネルを削除した場合) */}
          <DynamicContentArea
            currentView={currentView}
            isLoading={isLoading}
            onSubmitRequest={handleSubmitInitialRequest}
            experts={experts} // ストアから渡す
            proposalSummary={proposalSummary} // ストアから渡す
            userRequestForConfirmation={currentRequest}
            aiSuggestion={aiSuggestion}
            onSettingsChange={handleSettingsChange}
            analysisType={currentAnalysisType}
            selectedPersonaId={selectedPersonaId}
            onSelectPersona={handleSelectPersona}
            onBackToList={handleBackToList}
            onBackToDashboard={handleBackToDashboard}
            onViewPersonaList={handleViewPersonaList}
            onPersonaUpdate={handlePersonaUpdate}
            selectedPersonaIdsForQuery={selectedPersonaIdsForQuery}
            onPersonaSelectionChange={handlePersonaSelectionForQuery}
            onToggleSelectAllPersonasInList={handleToggleSelectAllPersonasForQuery} // ★ Pass handler
            isAllPersonasInListSelected={isAllDisplayedPersonasSelected()}      // ★ Pass calculated state
            onRelationshipNodeClick={handleRelationshipNodeClick} // ★ Pass handler
          />
        </ResizablePanel>
        {/* ★ Remove background classes from ResizableHandle */}
        <ResizableHandle withHandle className="border-0 bg-transparent" /> {/* ★ Remove border and make background transparent */}
        {/* ★ Increase minSize for the bottom panel, adjust inner div flex behavior */}
        <ResizablePanel defaultSize={35} minSize={25} className="min-h-0 flex flex-col"> {/* Increased minSize, added flex flex-col */}
          {/* Adjust div to allow chat history to shrink but input to stay fixed height */}
          <ChatHistoryArea chatHistory={chatHistory} onSendMessage={handleSendMessage} /> {/* Let ChatHistoryArea manage its own scroll/flex */}
          <AI_Prompt 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            selectedPersonaCountForQuery={selectedPersonaIdsForQuery.length} // ★ Pass the count
          />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ★ SimulationViewVerticalMenu を ResizablePanelGroup の外、右下に配置 */}
      {isPersonaGenerated && currentView !== 'initial' && currentView !== 'confirmation' && currentView !== 'generating' && (
        <SimulationViewVerticalMenu
          currentView={currentView}
          onMenuChange={handleMenuItemChange}
          availableMenuItems={mainSimulationMenuItems}
        />
      )}

      {/* Fluid Menu (左上) */}
      <div className="absolute top-8 left-8 z-50">
        <MenuContainer>
          <MenuItem
            icon={
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-100 scale-100 rotate-0 [div[data-expanded=true]_&]:opacity-0 [div[data-expanded=true]_&]:scale-0 [div[data-expanded=true]_&]:rotate-180">
                  <MenuIcon size={24} strokeWidth={1.5} />
                </div>
                <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-0 scale-0 -rotate-180 [div[data-expanded=true]_&]:opacity-100 [div[data-expanded=true]_&]:scale-100 [div[data-expanded=true]_&]:rotate-0">
                  <X size={24} strokeWidth={1.5} />
                </div>
              </div>
            }
          />
          <MenuItem icon={<Home size={24} strokeWidth={1.5} />} onClick={() => navigate('/')} />
          <MenuItem icon={<Sparkles size={24} strokeWidth={1.5} />} onClick={() => navigate('/persona-simulation')} isActive={true} />
          {/* Removed other menu items */}
        </MenuContainer>
      </div>
    </div>
  );
} 