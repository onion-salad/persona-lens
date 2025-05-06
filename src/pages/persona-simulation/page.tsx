import React, { useState, useEffect, useRef } from 'react';
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

// 仮の型定義
type AIPersona = {
  id: string;
  name: string;
  details: string; // 詳細情報
  response: string; // Step1の要望への回答
};

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
  role: 'user' | 'ai' | 'system'; // 'system' for initial prompts or mode changes
  content: string;
  actions?: ChatAction[];
  // Optional payload with the action, e.g., the suggestion for confirmation
  actionPayload?: any; // Although not directly used on the object, defines the concept
  // AIからの質問提案を含む場合
  proposal?: {
    question: string;
    onConfirm: () => void;
    onDeny: () => void;
  };
};

type ChatAction = {
  id: string;
  label: string;
  // onClick can now optionally receive payload
  onClick: (payload?: any) => void;
};

// Define possible views for the dynamic content area
type SimulationView =
  | 'initial'           // Welcome message, initial prompt
  | 'request_input'     // User inputs the simulation request (explicit step if needed)
  | 'confirmation'      // AI shows suggestions, user confirms/adjusts
  | 'generating'        // Loading indicator while personas are generated
  | 'results_dashboard' // Displaying the persona stats dashboard
  | 'analysis_result'   // Displaying analysis result
  | 'persona_list'      // Add persona list view
  | 'persona_detail'    // Add persona detail view
  | 'error';            // Error state

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
}
const ChatHistoryArea: React.FC<ChatHistoryAreaProps> = ({ chatHistory }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [chatHistory]);

  return (
    // ★ Re-add mask-image for top fade
    <div 
      className="h-80 md:h-96 flex-shrink-0 overflow-hidden bg-white relative"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)', // Fade in top
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
      }}
    >
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        {/* ★ Add padding top for the mask */}
        <div className="space-y-5 px-6 pb-5 pt-12 max-w-4xl mx-auto"> {/* Added pt-12 */}
          {chatHistory.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-start gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5 ${
                  msg.role === 'ai' ? 'bg-gray-200 text-gray-600' :
                  msg.role === 'user' ? 'bg-gray-800 text-white' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {msg.role === 'ai' && <Bot className="w-3.5 h-3.5" />}
                  {msg.role === 'user' && <User className="w-3.5 h-3.5" />}
                  {msg.role === 'system' && <Sparkles className="w-3.5 h-3.5" />}
                </div>
                <div className={`rounded-xl px-3.5 py-2.5 text-sm ${ 
                  msg.role === 'user'
                    ? 'bg-gray-900 text-white'
                    : msg.role === 'system'
                      ? 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                      : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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
  personas: AIPersona[];
  userRequestForConfirmation: string | null;
  aiSuggestion: AISuggestion | null;
  onSettingsChange: (newSettings: { count: number; level: DetailLevel }) => void;
  analysisType: string | null;
  selectedPersonaId: string | null;
  onSelectPersona: (id: string) => void;
  onBackToList: () => void;
  onBackToDashboard: () => void;
  onViewPersonaList: () => void;
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
  personas: AIPersona[];
  onViewPersonaList: () => void; // Add callback to navigate to list
}
const ResultsDashboardView: React.FC<ResultsDashboardViewProps> = ({ personas, onViewPersonaList }) => {
   const totalPersonas = personas.length;

   const allWords = personas.flatMap(p => (p.response + ' ' + p.details).split(/\s+/))
       .map(word => word.toLowerCase().replace(/[.,!?;:]/g, ''))
       .filter(word => word.length > 3 && !/^[0-9]+$/.test(word));
   const wordCounts = allWords.reduce((acc, word) => {
       acc[word] = (acc[word] || 0) + 1;
       return acc;
   }, {} as Record<string, number>);
   const topKeywords = Object.entries(wordCounts)
       .sort(([, a], [, b]) => b - a)
       .slice(0, 12); // Show top 12 keywords

  return (
    <div className="h-full overflow-auto bg-white p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-5">
         <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-800">シミュレーション結果概要</h2>
         </div>
          {totalPersonas > 0 && (
             <Button variant="outline" size="sm" onClick={onViewPersonaList}>ペルソナ一覧を見る</Button>
          )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
           <CardHeader className="pb-3 pt-4 px-5">
             <CardDescription className="text-xs font-medium text-gray-500 uppercase tracking-wider">総ペルソナ数</CardDescription>
             <CardTitle className="text-3xl font-bold text-gray-900 mt-1">{totalPersonas}</CardTitle>
           </CardHeader>
         </Card>
         <Card className="bg-gray-50 border-gray-200 border-dashed flex flex-col items-center justify-center min-h-[90px]">
             <p className="text-sm font-medium text-gray-400 mb-1">感情分析 (近日実装)</p>
             <p className="text-xs text-gray-400">ポジティブ/ネガティブ傾向</p>
         </Card>
         <Card className="bg-gray-50 border-gray-200 border-dashed flex flex-col items-center justify-center min-h-[90px]">
             <p className="text-sm font-medium text-gray-400 mb-1">属性分布 (近日実装)</p>
              <p className="text-xs text-gray-400">年齢・地域など</p>
         </Card>
      </div>
       <div className="pt-2">
         <h3 className="text-base font-semibold text-gray-700 mb-3">注目キーワード (上位12件)</h3>
         {totalPersonas > 0 ? (
           <div className="flex flex-wrap gap-2">
             {topKeywords.map(([word, count]) => (
               <Badge key={word} variant="outline" className="px-2.5 py-0.5 text-xs font-medium bg-white border-gray-300 text-gray-700 shadow-xs">
                 {word} <span className="ml-1.5 text-gray-400">({count})</span>
               </Badge>
             ))}
             {topKeywords.length === 0 && <p className="text-xs text-gray-500">キーワードを抽出できませんでした。</p>}
           </div>
         ) : (
           <p className="text-xs text-gray-500">ペルソナデータがありません。</p>
         )}
       </div>
    </div>
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
  onSelectPersona: (id: string) => void;
  onBackToDashboard: () => void;
}

const PersonaListView: React.FC<PersonaListViewProps> = ({ personas, onSelectPersona, onBackToDashboard }) => {
  return (
    <div className="h-full overflow-auto bg-white p-6 md:p-8 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-800">生成されたペルソナ ({personas.length}人)</h2>
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
                <TableHead className="w-[200px] px-4 py-3 text-sm font-medium text-gray-600">名前</TableHead>
                <TableHead className="px-4 py-3 text-sm font-medium text-gray-600">詳細 (抜粋)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {personas.map((persona) => (
                <TableRow
                   key={persona.id}
                   onClick={() => onSelectPersona(persona.id)}
                   className="cursor-pointer hover:bg-gray-50 transition-colors"
                 >
                  <TableCell className="font-medium px-4 py-3 align-top w-[200px]">{persona.name}</TableCell>
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
  // onSaveChanges: (updatedPersona: AIPersona) => void; // For future editing
}

const PersonaDetailView: React.FC<PersonaDetailViewProps> = ({ persona, onBackToList }) => {
  if (!persona) {
    return (
      <div className="p-8 text-center text-gray-500">
        ペルソナが選択されていません。
        <Button variant="link" onClick={onBackToList}>リストに戻る</Button>
      </div>
    );
  }

  // Placeholder for editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editableDetails, setEditableDetails] = useState(persona.details);
  const [editableResponse, setEditableResponse] = useState(persona.response);


  return (
    <div className="h-full overflow-auto bg-white p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
       <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
         <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex-shrink-0">
              {persona.name.charAt(0).toUpperCase()}
           </div>
          <h2 className="text-xl font-semibold text-gray-800">{persona.name}</h2>
         </div>
         <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={onBackToList}>リストへ戻る</Button>
           {/* Edit Button Placeholder */}
           <Button variant="default" size="sm" onClick={() => setIsEditing(!isEditing)} disabled> 
             <Edit3 className="w-3.5 h-3.5 mr-1.5" />
             {isEditing ? '保存' : '編集'} (未実装)
           </Button>
         </div>
       </div>

      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">ペルソナ詳細</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
             <Textarea value={editableDetails} onChange={(e) => setEditableDetails(e.target.value)} rows={6} className="w-full text-sm" />
           ) : (
             <p className="text-sm text-gray-700 whitespace-pre-wrap">{persona.details}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-50/50 border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">AIの応答 (初期リクエストに対して)</CardTitle>
        </CardHeader>
        <CardContent>
           {isEditing ? (
             <Textarea value={editableResponse} onChange={(e) => setEditableResponse(e.target.value)} rows={8} className="w-full text-sm" />
           ) : (
             <p className="text-sm text-gray-700 whitespace-pre-wrap">{persona.response}</p>
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

const DynamicContentArea: React.FC<DynamicContentAreaProps> = ({
  currentView,
  isLoading,
  onSubmitRequest,
  personas,
  userRequestForConfirmation,
  aiSuggestion,
  onSettingsChange,
  analysisType,
  selectedPersonaId,
  onSelectPersona,
  onBackToList,
  onBackToDashboard,
  onViewPersonaList
}) => {
  const variants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
  };

  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

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
      case 'confirmation': return userRequestForConfirmation && aiSuggestion ? <ConfirmationView userRequest={userRequestForConfirmation} suggestion={aiSuggestion} onSettingsChange={onSettingsChange} /> : null;
      case 'results_dashboard': return <ResultsDashboardView personas={personas} onViewPersonaList={onViewPersonaList} />;
      case 'analysis_result': return analysisType ? <AnalysisResultView analysisType={analysisType} personas={personas} onViewPersonaList={onViewPersonaList} /> : null;
      case 'persona_list': return <PersonaListView personas={personas} onSelectPersona={onSelectPersona} onBackToDashboard={onBackToDashboard}/>;
      case 'persona_detail': return <PersonaDetailView persona={selectedPersona ?? null} onBackToList={onBackToList} />;
      case 'error': return <ErrorView />;
      default: return null;
    }
  };

  return (
    // ★ Add relative positioning and mask for bottom fade
    <div 
      className="flex-grow overflow-hidden bg-white relative" 
      style={{
        maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', // Fade out bottom
        WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)',
      }}
    >
      {/* Add padding bottom to prevent content from being cut off by the mask */}
      <div className="absolute inset-0 overflow-auto pb-10"> {/* Added pb-10 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (currentView === 'analysis_result' ? analysisType : '') + (currentView === 'persona_detail' ? selectedPersonaId : '')} 
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            // ★ Remove flex centering, content should align normally
            className="h-full" // Ensure motion div takes full height for padding
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
  const [currentView, setCurrentView] = useState<SimulationView>('initial');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultSets, setResultSets] = useState<ResultSet[]>([]); 
  const [displayedResultSetIndex, setDisplayedResultSetIndex] = useState<number>(0);
  const [currentRequest, setCurrentRequest] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [currentSettings, setCurrentSettings] = useState<{ count: number; level: DetailLevel } | null>(null);
  const [currentAnalysisType, setCurrentAnalysisType] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [viewBeforeList, setViewBeforeList] = useState<SimulationView>('results_dashboard');
  const navigate = useNavigate(); // ★ Initialize useNavigate

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
    setCurrentView(viewBeforeList);
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
      // Accept mode for regular messages or action string for action clicks
      modeOrAction: 'normal' | 'persona_question' | `Action: ${string}` = 'normal',
      payload: any = null
  ) => {
    // Determine if it's an action click based on the modeOrAction parameter
    const isActionClick = typeof modeOrAction === 'string' && modeOrAction.startsWith('Action:');
    // Determine the current mode (relevant for non-action messages)
    const currentMode = isActionClick ? 'normal' : modeOrAction;

    console.log(`handleSendMessage called. isLoading: ${isLoading}, message: ${message}, mode/action: ${modeOrAction}, payload: ${JSON.stringify(payload)}`);
    if (isLoading) { 
        console.warn("Attempted to send message while already loading. Aborting.");
        return; 
    }
    setIsLoading(true);
    console.log("isLoading set to true");
    const messageTimestamp = Date.now();
    let aiResponse: ChatMessage | null = null;
    let nextView: SimulationView = currentView;
    const aiResponseId = `ai-${messageTimestamp}`;
    let viewChangedInternally = false; // Flag if view is set inside logic

    // Add user message first if applicable
    if (!isActionClick) { 
      // Prepend mode indicator for persona questions
      const userMessageContent = currentMode === 'persona_question' ? `[ペルソナへの質問]\n${message}` : message;
      const newUserMessage: ChatMessage = { id: `user-${messageTimestamp}`, role: 'user', content: userMessageContent };
      console.log("Adding user message:", newUserMessage.id);
      setChatHistory(prev => addUniqueMessage(prev, newUserMessage));
    }
    else { console.log(`Action Triggered: ${modeOrAction} (Timestamp: ${messageTimestamp}) with payload:`, payload); }

    try {
      await new Promise(resolve => setTimeout(resolve, 50)); // Short delay for state update
      console.log(`Processing logic. Current View was: ${currentView}, Message: ${message}, Mode/Action: ${modeOrAction}`);

      // --- BRANCH 1: Handle ALL Actions --- 
      if (isActionClick) {
          const action = modeOrAction.split(': ')[1].trim(); // Get action from modeOrAction
          console.log(`[Action Branch] Processing action: ${action}`);

          // Helper functions for actions, passing the action string now
          const handleAnalysisAction = (analysisType: string, personasPayload: AIPersona[]) => { handleSendMessage(analysisType, `Action: ${analysisType} を実行`, { personas: personasPayload }); };
          const handleViewListAction = () => { handleSendMessage('View Persona List', 'Action: View Persona List'); };

          if (action === 'Confirm Generation' && payload?.suggestion) {
              const suggestionFromPayload = payload.suggestion as AISuggestion & { requestContext?: string };
              const settingsToUse = currentSettings ?? { count: suggestionFromPayload.selectedPersonaCount, level: suggestionFromPayload.detailLevel }; // Use currentSettings if available
              console.log("[Debug] Settings derived for generation:", settingsToUse);
              aiResponse = {
                id: aiResponseId,
                role: 'ai',
                // Simplified AI response, removed ID
                content: `承知しました。ペルソナ (${settingsToUse.count}人, 詳細度: ${detailLevelLabels[settingsToUse.level]}) を生成します...`
              };
              nextView = 'generating'; // Target view
              console.log(`[Debug] Confirm Generation action. Intending view: ${nextView}. Starting generation...`);
              if(aiResponse) { setChatHistory(prev => addUniqueMessage(prev, aiResponse!)); }
              setCurrentView('generating'); // Set view NOW
              viewChangedInternally = true;
              // --- Start Async Generation --- 
              setTimeout(async () => { 
                 const generationStartTime = Date.now();
                 try {
                    console.log("Starting generation with settings:", settingsToUse);
                    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000)); // Simulate generation time
                    const generatedCount = settingsToUse.count;
                    const detailLevel = settingsToUse.level;

                    // --- Richer Mock Persona Generation (using context) --- 
                    const mockNames = ['佐藤 裕子', 'Michael Chen', '田中 健太', 'Emily White', '鈴木 あかり', 'David Rodriguez', '高橋 直樹', 'Sophia Lee', '渡辺 恵子', 'Daniel Kim'];
                    const mockOccupations = ['デザイナー', '学生', 'エンジニア', 'マーケター', '主婦', '経営者', 'フリーランサー', '教師'];
                    const mockInterests = ['最新テクノロジー', 'ミニマリズム', '旅行', '料理', 'ゲーム', '読書', '音楽鑑賞', 'アウトドア'];
                    const mockPersonalities = ['慎重派', '楽観的', '分析的', '社交的', '内向的', '現実的'];

                    const reqContext = (suggestionFromPayload.requestContext || "").toLowerCase();
                    let contextFocus = "標準";
                    if (reqContext.includes('ui') || reqContext.includes('デザイン') || reqContext.includes('ux')) contextFocus = "UI/UX";
                    else if (reqContext.includes('価格') || reqContext.includes('コスト') || reqContext.includes('料金')) contextFocus = "価格";
                    else if (reqContext.includes('学生') || reqContext.includes('若者')) contextFocus = "若年層";

                    const initialResults: AIPersona[] = Array.from({ length: generatedCount }).map((_, i) => {
                        const name = mockNames[i % mockNames.length];
                        const ageRange = `${Math.floor(Math.random() * 4 + 2) * 10}代`; // 20代-50代
                        const occupation = mockOccupations[Math.floor(Math.random() * mockOccupations.length)];
                        let details = `${ageRange}, ${occupation}, ${mockPersonalities[Math.floor(Math.random() * mockPersonalities.length)]}. `;
                        details += `興味: ${mockInterests[Math.floor(Math.random() * mockInterests.length)]}. `;

                        let response = "";
                        const baseResponse = [
                            "全体的には良い印象ですが、いくつか改善点も感じました。",
                            "直感的に操作でき、非常に使いやすいと思います。",
                            "機能は豊富ですが、少し複雑に感じる部分もありました。",
                            "デザインが洗練されていて、好感が持てます。",
                            "期待していた通りの機能性で満足しています。",
                            "もう少しシンプルな方が好みかもしれません。",
                            "他の類似サービスと比較しても、競争力があると感じます。",
                            "初心者でもすぐに使いこなせそうです。"
                        ];
                        response = baseResponse[Math.floor(Math.random() * baseResponse.length)];

                        if (detailLevel === 'medium' || detailLevel === 'high') {
                             details += `テクノロジーへの関心: ${Math.random() > 0.5 ? '高い' : '普通'}. `;
                             if (contextFocus === "UI/UX") {
                                 details += "特にインターフェースの使いやすさを重視する傾向。";
                                 response += " ナビゲーションがもう少し分かりやすいと、さらに良いでしょう。";
                             } else if (contextFocus === "価格") {
                                 details += "コストパフォーマンスに関心あり。";
                                 response += " 価格設定については、もう少し手頃だと嬉しいです。";
                             }
                        }
                         if (detailLevel === 'high') {
                             details += `PC/スマホ利用歴: ${Math.floor(Math.random() * 10 + 5)}年以上. `;
                             response += ` 詳細なレポート機能があれば、業務効率が上がりそうです。`;
                         }

                        return {
                             id: `p${generationStartTime}-${i + 1}`,
                             name: name,
                             details: details.trim(),
                             response: response.trim()
                         };
                     });
                    // --- End of Mock Persona Generation --- 

                    const newResultSet: ResultSet = { id: `res-${generationStartTime}`, title: '初期生成結果', personas: initialResults }; // More descriptive title
                    console.log(`[Debug] Generated ResultSet ID: ${newResultSet.id}, Personas Count: ${initialResults.length}`);
                    // Add new result set and update displayed index immediately
                    setResultSets(prev => [...prev, newResultSet]);
                    setDisplayedResultSetIndex(resultSets.length); // Index will be the new length - 1

                    const generationCompleteMsg: ChatMessage = {
                        id: `sys-gen-complete-${generationStartTime}`, role: 'system',
                        content: `ペルソナ生成 (${initialResults.length}人) が完了しました。結果概要を上に表示します。\n追加分析や個別リストの確認も可能です。`,
                        actions: [
                           { id: 'act-sentiment', label: '感情分析を実行', onClick: () => handleAnalysisAction('感情分析', initialResults) }, 
                           { id: 'act-keywords', label: '主要キーワード抽出', onClick: () => handleAnalysisAction('キーワード抽出', initialResults) }, 
                           { id: 'act-view-list', label: 'ペルソナ一覧を見る', onClick: handleViewListAction }, 
                         ]
                    };
                    console.log("Generation complete. Adding system message:", generationCompleteMsg.id);
                    setChatHistory(prev => addUniqueMessage(prev, generationCompleteMsg));
                    setCurrentView('results_dashboard');
                    setCurrentRequest(null); setAiSuggestion(null); setCurrentSettings(null); // Reset suggestion/settings
                    console.log("Generation successful. View set to results_dashboard.");
                 } catch (genError) { 
                    console.error("Generation error inside setTimeout:", genError);
                    const errorMsg: ChatMessage = { id: `err-gen-${generationStartTime}`, role: 'system', content: 'ペルソナ生成中にエラーが発生しました。' };
                    setChatHistory(prev => addUniqueMessage(prev, errorMsg));
                    setCurrentView('error');
                 } finally { 
                    console.log("Generation setTimeout finally block. Setting isLoading to false.");
                    setIsLoading(false);
                 }
               }, 100); // Short delay before starting the fake generation
               // isLoading remains true until generation setTimeout finishes

          } else if (action === 'Request Modification') {
              console.log("[Action Branch] Request Modification");
              aiResponse = { id: aiResponseId, role: 'ai', content: `修正指示ですね。申し訳ありませんが、この機能は現在実装中です。設定を調整し、「はい、生成を開始」ボタンを押してください。` }; // Removed ID
              nextView = 'confirmation'; // Stay in confirmation view
              setIsLoading(false);

          } else if (action === '感情分析 を実行' && payload?.personas) {
              const targetPersonas = payload.personas as AIPersona[];
              console.log(`[Action Branch] 感情分析 using payload. Found ${targetPersonas.length} personas.`);
              if (targetPersonas.length > 0) {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `了解しました。「感情分析」を実行し、結果を表示します。` }; // Removed ID
                  setCurrentAnalysisType('感情分析');
                  // Find the result set containing these personas
                  const matchingIndex = resultSets.findIndex(rs => rs.personas === targetPersonas);
                  if (matchingIndex !== -1) {
                     setDisplayedResultSetIndex(matchingIndex);
                     console.log(`[Action Branch] Set displayed index to ${matchingIndex} for analysis.`);
                  } else {
                     console.warn("[Action Branch] Could not find matching result set index for sentiment analysis payload.");
                     // Fallback: Display the latest result set if available
                     if (resultSets.length > 0) setDisplayedResultSetIndex(resultSets.length - 1);
                  }
                  nextView = 'analysis_result';
                  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate analysis time
              } else {
                  console.warn(`[Action Branch] Payload contained 0 personas for 感情分析.`);
                  aiResponse = { id: aiResponseId, role: 'ai', content: `分析対象のデータが見つかりませんでした。` };
                  nextView = currentView; 
              }
              setIsLoading(false);

          } else if (action === 'キーワード抽出 を実行' && payload?.personas) {
              const targetPersonas = payload.personas as AIPersona[];
              console.log(`[Action Branch] キーワード抽出 using payload. Found ${targetPersonas.length} personas.`);
               if (targetPersonas.length > 0) {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `了解しました。「キーワード抽出」を実行し、結果を表示します。` }; // Removed ID
                  setCurrentAnalysisType('キーワード抽出');
                  const matchingIndex = resultSets.findIndex(rs => rs.personas === targetPersonas);
                  if (matchingIndex !== -1) {
                     setDisplayedResultSetIndex(matchingIndex);
                     console.log(`[Action Branch] Set displayed index to ${matchingIndex} for keyword analysis.`);
                  } else {
                     console.warn("[Action Branch] Could not find matching result set index for keyword analysis payload.");
                     if (resultSets.length > 0) setDisplayedResultSetIndex(resultSets.length - 1);
                  }
                  nextView = 'analysis_result';
                  await new Promise(resolve => setTimeout(resolve, 300)); 
               } else {
                   console.warn(`[Action Branch] Payload contained 0 personas for キーワード抽出.`);
                   aiResponse = { id: aiResponseId, role: 'ai', content: `分析対象のデータが見つかりませんでした。` };
                   nextView = currentView; 
               }
              setIsLoading(false);

          } else if (action === 'View Persona List') {
              console.log("[Action Branch] View Persona List");
              if (resultSets.length > 0) {
                  aiResponse = { id: `sys-view-list-${messageTimestamp}`, role: 'system', content: `ペルソナ一覧を表示します。` }; // Removed ID
                  handleViewPersonaList(); // Sets view internally
                  nextView = 'persona_list';
                  viewChangedInternally = true;
              } else {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `表示するペルソナリストがありません。先にペルソナを生成してください。` };
                  nextView = currentView;
              }
              setIsLoading(false);

          } else {
              console.warn(`[Action Branch] Unknown action or missing data: ${action}`);
              aiResponse = { id: aiResponseId, role: 'ai', content: `アクション「${action}」を実行できませんでした。` };
              nextView = currentView; // Stay in current view
              setIsLoading(false);
          }
      // --- BRANCH 2: Handle Non-Action Messages based on Current View & Mode --- 
      } else if (!isActionClick) {
          console.log(`[View Branch] Processing text message in view: ${currentView}, Mode: ${currentMode}`);

          // --- Sub-Branch 2.1: Normal Mode --- 
          if (currentMode === 'normal') {
              if (currentView === 'initial') {
                  console.log("Processing initial user request (Normal Mode).");
                  setCurrentRequest(message);
                  // --- Generate Suggestion --- 
                  let attributes = "属性: 標準セット";
                  const reqLower = message.toLowerCase();
                  let contextFocus = "標準"; 
                  if (reqLower.includes('ui') || reqLower.includes('デザイン')) { attributes = "属性: UI/UX重視"; contextFocus = "UI/UX"; }
                  else if (reqLower.includes('価格') || reqLower.includes('コスト')) { attributes = "属性: 価格感度 高"; contextFocus = "価格"; }
                  else if (reqLower.includes('学生') || reqLower.includes('若者')) { attributes = "属性: 若年層中心"; contextFocus = "若年層"; }

                  const dummySuggestion: AISuggestion & { requestContext?: string } = {
                   personaCountOptions: [5, 10, 20],
                   selectedPersonaCount: Math.random() < 0.3 ? 5 : Math.random() < 0.6 ? 10 : 15, // Randomize default slightly
                   attributes: attributes + " (自動提案)",
                   detailLevel: 'medium',
                   requestContext: message // Pass original request for context
                  };

                  setAiSuggestion(dummySuggestion); 
                  // Set initial settings based on suggestion
                  setCurrentSettings({ count: dummySuggestion.selectedPersonaCount, level: dummySuggestion.detailLevel });
                  
                  // --- Create Confirmation Response --- 
                  const handleConfirmAction = (suggestionPayload: AISuggestion & { requestContext?: string }) => {
                      console.log("Confirm Action Clicked with payload:", suggestionPayload);
                      // Pass the suggestion object in the payload
                      handleSendMessage('Confirm Generation', 'Action: Confirm Generation', { suggestion: suggestionPayload });
                  };
                  const handleModifyAction = () => {
                      handleSendMessage('Request Modification', 'Action: Request Modification');
                  };
                  aiResponse = {
                      id: aiResponseId, role: 'ai',
                      content: `リクエスト了解しました。\nペルソナ${dummySuggestion.selectedPersonaCount}人 (詳細度: ${detailLevelLabels[dummySuggestion.detailLevel]}, ${dummySuggestion.attributes}) の生成を提案します。\n内容を確認・調整し、下のボタンで指示してください。`,
                      actions: [
                          { id: 'act-confirm-gen', label: 'はい、生成を開始', onClick: () => handleConfirmAction(dummySuggestion) },
                          { id: 'act-req-modify', label: 'いいえ、修正を指示 (未実装)', onClick: handleModifyAction },
                      ]
                  };
                  nextView = 'confirmation';
                  setIsLoading(false); 

              } else if (currentView === 'confirmation') {
                  console.log("Processing unexpected text input during confirmation (Normal Mode).");
                  aiResponse = { id: aiResponseId, role: 'ai', content: `設定を確認・調整し、下のボタンで指示してください。` }; // Removed ID
                  nextView = 'confirmation';
                  setIsLoading(false);

              } else if (currentView === 'results_dashboard' || currentView === 'analysis_result' || currentView === 'persona_list' || currentView === 'persona_detail') {
                  console.log("Processing follow-up text message (Normal Mode).");
                  // Simple echo for now, future: more complex interaction
                  aiResponse = { id: aiResponseId, role: 'ai', content: `メッセージ「${message}」を受け取りました。(通常モード: 対話機能は未実装)` }; // Removed ID
                  nextView = currentView;
                  setIsLoading(false);

              } else if (currentView === 'generating') {
                  console.log("Message received while generating (Normal Mode).");
                  aiResponse = { id: aiResponseId, role: 'ai', content: '現在ペルソナ生成中です。完了までお待ちください。' };
                  nextView = 'generating';
                  // isLoading remains true
              } else {
                  console.log(`[View Branch] Fallback for text in view: ${currentView} (Normal Mode)`);
                  aiResponse = { id: aiResponseId, role: 'ai', content: `(現在の状態: ${currentView}) 「${message}」に予期せぬタイミングで応答できません。` };
                  setIsLoading(false);
                  nextView = currentView;
              }
          // --- Sub-Branch 2.2: Persona Question Mode --- 
          } else if (currentMode === 'persona_question') {
              console.log("Processing persona question.");
              if (resultSets.length > 0 && resultSets[displayedResultSetIndex]?.personas?.length > 0) {
                  const currentPersonas = resultSets[displayedResultSetIndex].personas;
                  // Simple placeholder response for persona question
                  aiResponse = { id: aiResponseId, role: 'ai', content: `ペルソナへの質問「${message}」を受け取りました。\n(各ペルソナからの回答生成は未実装です)` };
                  // Future: Implement actual persona response generation here
                  // e.g., const personaResponses = await generatePersonaResponses(currentPersonas, message);
                  // aiResponse.content += "\n---\n" + personaResponses.join("\n---\n");
              } else {
                  aiResponse = { id: aiResponseId, role: 'ai', content: `質問対象のペルソナがいません。先にペルソナを生成してください。` };
              }
              nextView = currentView; // Stay in the current view
              setIsLoading(false);
          }
      // --- BRANCH 3: Fallback (Should not be reached often) --- 
      } else {
           console.log(`[Fallback Branch] Unhandled state/message combination. View: ${currentView}, Message: ${message}, Mode/Action: ${modeOrAction}`);
           aiResponse = { id: aiResponseId, role: 'ai', content: `予期せぬエラーが発生しました。処理を続行できません。` };
           setIsLoading(false);
           nextView = currentView; // Or potentially 'error' view
      }

      // --- Final State Updates --- 
      // Add AI response unless it was added before setTimeout (Confirm Generation action)
      let shouldAddResponse = true;
      if (isActionClick) {
          const actionInner = modeOrAction.split(': ')[1].trim();
          if (actionInner === 'Confirm Generation' && payload?.suggestion) {
              shouldAddResponse = false; // Already added before setTimeout
          }
      }
      if(aiResponse && shouldAddResponse) {
          console.log("Adding AI/System message:", aiResponse.id);
          setChatHistory(prev => addUniqueMessage(prev, aiResponse!));
      }

      // Update view state ONLY if changed AND not handled internally
      if (nextView !== currentView && !viewChangedInternally) {
          console.log(`Attempting to change view from ${currentView} to ${nextView}`);
          setCurrentView(nextView);
          console.log(`View changed to ${nextView}`);
      } else if (nextView === currentView) {
          console.log(`View remains ${currentView}`);
      } else {
          console.log(`View change for ${nextView} was handled internally.`);
      }
      // Ensure isLoading is false unless generation is ongoing
      if (!(isActionClick && modeOrAction.startsWith('Action: Confirm Generation'))) {
          // Check if generation is NOT the action that keeps isLoading true
          if (isLoading && !(currentView === 'generating')) {
             //This condition should only be met if generation finished/errored in the action block
          } else if (currentView !== 'generating') {
              // If not generating, ensure loading is false (unless set true at start)
              // The setTimeout in generation handles its own isLoading=false
              // console.log(`End of handleSendMessage. Setting isLoading to false (not generating).`);
              // setIsLoading(false); // This might be causing premature loading=false
          }
      }
      console.log(`End of handleSendMessage. isLoading state reflects outcome (should be true only if generating). Current view: ${currentView}`);

    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      const errorMsg: ChatMessage = { id: `err-${Date.now()}`, role: 'system', content: '処理中にエラーが発生しました。' };
      setChatHistory(prev => addUniqueMessage(prev, errorMsg));
      setCurrentView('error');
      console.error("Caught error. Setting isLoading to false.");
      setIsLoading(false);
    }
  };

  // Initial request submission (no changes needed here)
  const handleSubmitInitialRequest = (request: string) => {
    handleSendMessage(request, 'normal'); // Explicitly pass 'normal' mode
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden relative"> {/* ★ Added relative positioning */}
      <DynamicContentArea
        currentView={currentView}
        isLoading={isLoading}
        onSubmitRequest={handleSubmitInitialRequest}
        personas={resultSets[displayedResultSetIndex]?.personas ?? []}
        userRequestForConfirmation={currentRequest}
        aiSuggestion={aiSuggestion}
        onSettingsChange={handleSettingsChange}
        analysisType={currentAnalysisType}
        selectedPersonaId={selectedPersonaId}
        onSelectPersona={handleSelectPersona}
        onBackToList={handleBackToList}
        onBackToDashboard={handleBackToDashboard}
        onViewPersonaList={handleViewPersonaList}
      />
      <ChatHistoryArea chatHistory={chatHistory} />
      <AI_Prompt onSendMessage={handleSendMessage} isLoading={isLoading} />

      {/* ★ Fluid Menu positioned at top left */}
      <div className="absolute top-8 left-8 z-50"> {/* Changed positioning */}
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