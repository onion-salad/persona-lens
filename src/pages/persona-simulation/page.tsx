import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Sparkles, ChevronRight, ArrowRight, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

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

// 結果セットの型
type ResultSet = {
  id: string; // 結果セットを識別するID (例: 'initial', 'follow-up-1')
  title: string; // テーブルのタイトル (例: '初期結果', '追加質問: 価格について')
  personas: AIPersona[];
};

// チャットメッセージの型
type ChatMessage = {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  // AIからの質問提案を含む場合
  proposal?: {
    question: string;
    onConfirm: () => void;
    onDeny: () => void;
  };
};

// シンプルなプログレスバー形式のステップ表示
const SimulationSteps: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const totalSteps = 5;

  return (
    // ステップ表示全体のコンテナ (マージン維持)
    <div className="w-full max-w-6xl mb-6">
      {/* 細い棒 (プログレスバー) */}
      <div className="flex w-full h-1 rounded-full overflow-hidden bg-gray-200">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 transition-colors duration-300 ${
              index <= currentStep ? 'bg-gray-900' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

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

// 洗練された Step 2: 提案確認 & 修正
const Step2_Confirmation: React.FC<{
  suggestion: AISuggestion;
  onApprove: () => void;
  onRegenerate: (feedback?: string) => void;
}> = ({ suggestion, onApprove, onRegenerate }) => {
  const [feedback, setFeedback] = useState('');
  
  return (
    <div className="w-full max-w-6xl bg-white transition-all duration-300 border-none">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <CardTitle className="text-2xl font-bold text-gray-900">AIからの提案内容の確認</CardTitle>
        </div>
        <CardDescription className="text-gray-600 text-base">
          AIが分析したシミュレーション計画です。内容を確認して承認するか、修正を依頼してください。
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* AIの提案内容 */}
        <div className="bg-gray-50 p-6 rounded-md space-y-4">
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-gray-700 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">AIのシミュレーション提案</h3>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-center">
                  <span className="font-medium min-w-32">必要なペルソナ:</span>
                  <span className="ml-2">{suggestion.selectedPersonaCount}人</span>
                  <div className="ml-4 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    推奨オプション: {suggestion.personaCountOptions.join(', ')}人
                  </div>
                </div>
                
                <div className="flex items-start">
                  <span className="font-medium min-w-32">ペルソナ属性:</span>
                  <span className="ml-2">{suggestion.attributes}</span>
                </div>
                
                <div className="flex items-center">
                  <span className="font-medium min-w-32">詳細度:</span>
                  <span className="ml-2">
                    {suggestion.detailLevel === 'low' && '低 (基本情報のみ)'}
                    {suggestion.detailLevel === 'medium' && '中 (主要な特性を含む)'}
                    {suggestion.detailLevel === 'high' && '高 (細かい嗜好や行動パターンを含む)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 修正指示フォーム */}
        <div className="space-y-3">
          <Label htmlFor="feedback" className="text-gray-900 font-medium">修正指示・追加要望 (任意)</Label>
          <Textarea
            id="feedback"
            placeholder="例: もっと若年層の意見も聞きたいので、20代のペルソナを増やしてください。"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full p-4 text-base text-gray-900 bg-gray-50 rounded-md focus:border-gray-400 focus:ring-gray-400 resize-none"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          onClick={() => onRegenerate(feedback || undefined)}
          className="px-5 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
        >
          再生成を依頼
        </Button>
        
        <Button 
          onClick={onApprove} 
          className="px-6 py-2 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-md transition-colors duration-200 flex items-center space-x-2"
        >
          <span>承認して次へ進む</span>
          <ArrowRight className="w-5 h-5" />
        </Button>
      </CardFooter>
    </div>
  );
};

// 洗練された Step 3: ペルソナ生成中
const Step3_Generation: React.FC = () => {
  return (
    <Card className="w-full max-w-6xl bg-white transition-all duration-300 border-none">
      <CardHeader className="pb-3">
        <div className="flex items-center">
          <CardTitle className="text-2xl font-bold text-gray-900">AIペルソナ生成中</CardTitle>
        </div>
        <CardDescription className="text-gray-600 text-base">
          承認された内容に基づき、AIペルソナを生成しています...
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 space-y-6">
        <div className="relative w-16 h-16">
          <Loader2 className="w-16 h-16 text-gray-300 animate-spin" />
          <Sparkles className="w-8 h-8 text-gray-900 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <div className="text-center space-y-2 max-w-md">
          <p className="text-gray-700">AIがあなたの要望に最適なペルソナを生成しています</p>
          <p className="text-sm text-gray-500">このプロセスには数秒かかることがあります</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Step4_Results: Card を削除し、div をルートに
const Step4_Results: React.FC<{
  results: AIPersona[];
  onUpdatePersona: (personaId: string, field: keyof Omit<AIPersona, 'id'>, value: string) => void;
  selectedPersonaIds: string[];
  onTogglePersonaSelection: (personaId: string) => void;
}> = ({ results, onUpdatePersona, selectedPersonaIds, onTogglePersonaSelection }) => {
  return (
    // Card, CardHeader, CardContent を削除。ルートをdivに変更し、paddingを追加。
    <div className="w-full bg-white p-6 rounded-lg"> {/* 例: p-6 と背景、角丸を追加 */} 
      {/* テーブルを囲むdivはそのまま */} 
      <div className="rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="border-none">
              <TableHead className="w-[50px] py-4"></TableHead>
              <TableHead className="w-[180px] py-4 text-gray-900 font-semibold">ペルソナ名</TableHead>
              <TableHead className="py-4 text-gray-900 font-semibold">詳細情報</TableHead>
              <TableHead className="py-4 text-gray-900 font-semibold">回答</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow className="border-none">
                <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                  結果はまだありません。
                </TableCell>
              </TableRow>
            ) : (
              results.map((persona) => (
                <TableRow key={persona.id} className="hover:bg-gray-50 transition-colors duration-150 border-b">
                  <TableCell className="p-1 align-middle border-r">
                    <Checkbox 
                      id={`select-${persona.id}`}
                      checked={selectedPersonaIds.includes(persona.id)}
                      onCheckedChange={() => onTogglePersonaSelection(persona.id)}
                      className="ml-2 border border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:text-white"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 p-1 align-top border-r">
                    <Input 
                      value={persona.name}
                      onChange={(e) => onUpdatePersona(persona.id, 'name', e.target.value)}
                      className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-gray-400 h-auto p-2"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 whitespace-pre-wrap p-1 align-top border-r">
                    <Textarea
                      value={persona.details}
                      onChange={(e) => onUpdatePersona(persona.id, 'details', e.target.value)}
                      className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-gray-400 min-h-[100px] p-2 resize-none"
                      rows={3} 
                    />
                  </TableCell>
                  <TableCell className="whitespace-pre-wrap text-gray-800 p-1 align-top">
                     <Textarea
                      value={persona.response}
                      onChange={(e) => onUpdatePersona(persona.id, 'response', e.target.value)}
                      className="border-none bg-transparent focus-visible:ring-1 focus-visible:ring-gray-400 min-h-[100px] p-2 resize-none"
                      rows={3}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// OrchestratorChat: Card を削除し、div をルートに
const OrchestratorChat: React.FC<{ 
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  isPersonaMode: boolean;
  onPersonaModeChange: (checked: boolean) => void;
}> = ({ chatHistory, onSendMessage, isPersonaMode, onPersonaModeChange }) => {
  const [userInput, setUserInput] = useState('');

  const handleSend = () => {
    if (!userInput.trim()) return;
    onSendMessage(userInput);
    setUserInput('');
  };

  return (
    // Card, CardHeader, CardContent を削除。ルートをdivに変更し、スタイル調整。
    <div className="w-full bg-white p-6 rounded-lg flex flex-col h-full"> {/* 例: p-6, 背景, 角丸, 高さ確保 */} 
      {/* --- チャット設定エリア --- */}
      <div className="pb-4 mb-4 border-b border-gray-100"> 
        <div className="flex items-center space-x-2 justify-end"> 
          <Switch 
            id="persona-mode-switch"
            checked={isPersonaMode}
            onCheckedChange={onPersonaModeChange}
            className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200"
          />
          <Label htmlFor="persona-mode-switch" className="text-sm font-medium text-gray-700">
            選択したペルソナで回答する
          </Label>
        </div>
      </div>
      {/* --- ここまでチャット設定エリア --- */}

      {/* --- メインチャットエリア (flex-growで高さを埋める) --- */} 
      <div className="flex-grow flex flex-col space-y-4">
        {/* チャット履歴 */} 
        <ScrollArea className="w-full rounded-md p-4 bg-gray-50 flex-grow">
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 ${
                    msg.role === 'ai' ? 'bg-gray-100 text-gray-800' : 
                    msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {msg.role === 'ai' && <Bot className="w-5 h-5" />}
                    {msg.role === 'user' && <User className="w-4 h-4" />}
                    {msg.role === 'system' && <Sparkles className="w-4 h-4" />}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    msg.role === 'user' 
                      ? 'bg-gray-900 text-white' 
                      : msg.role === 'system'
                        ? 'bg-gray-200 text-gray-800'
                        : 'bg-white border border-gray-200 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.role === 'ai' && msg.proposal && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={msg.proposal.onDeny}
                          className="px-3 py-1 text-xs bg-transparent text-gray-600 hover:bg-gray-100"
                        >
                          いいえ
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={msg.proposal.onConfirm}
                          className="px-3 py-1 text-xs bg-gray-800 text-white hover:bg-gray-700"
                        >
                          はい、聞いてください
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {/* 入力エリア */} 
        <div className="flex gap-3 pt-2">
          <Input 
            type="text"
            placeholder="AIに質問や分析依頼を入力..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-gray-50 text-gray-900 rounded-md py-3 px-4 focus:border-gray-400 focus:ring-gray-400"
          />
          <Button 
            onClick={handleSend} 
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-5 rounded-md transition-colors duration-200 flex items-center space-x-2"
          >
            <span>送信</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* --- ここまでメインチャットエリア --- */}
    </div>
  );
};

// --- メインページコンポーネント --- 
export function PersonaSimulationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userRequest, setUserRequest] = useState<string>('');
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [resultSets, setResultSets] = useState<ResultSet[]>([]);
  const [displayedResultSetIndex, setDisplayedResultSetIndex] = useState<number>(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [isPersonaChatMode, setIsPersonaChatMode] = useState<boolean>(false);

  // Step 1 -> Step 2 (仮のAI提案生成ロジック)
  const handleStep1Submit = (request: string) => {
    setUserRequest(request);
    // --- ここで本来はAPIを呼び出しAI提案を取得 ---
    const dummySuggestion: AISuggestion = {
      personaCountOptions: [5, 10, 20],
      selectedPersonaCount: 10,
      attributes: "性別: 多様, 国籍: 多様, 経済状況: 多様",
      detailLevel: 'medium',
    };
    setAiSuggestion(dummySuggestion);
    // --- ここまで仮 --- 
    setCurrentStep(1);
  };

  // Step 2 -> Step 3 (承認) -> Step 4 (結果表示) -> Step 5 (対話開始)
  const handleStep2Approve = () => {
    setCurrentStep(2); // Step 3: 生成中へ
    // --- ここで本来はペルソナ生成APIを呼び出す ---
    // 仮のタイマーで Step 4 & 5 へ
    setTimeout(() => {
      // --- APIから結果取得後 --- 
       const initialResults: AIPersona[] = [
         { id: 'p1', name: '佐藤 優子', details: '32歳女性, 東京在住, IT企業勤務, アプリに詳しい', response: 'UIは直感的だが、検索機能が欲しい。ないと不便。' },
         { id: 'p2', name: 'John Smith', details: '45歳男性, NY在住, マーケティングマネージャー, 多忙', response: '機能は十分だが、モバイルアプリ版がないと使わない。' },
         { id: 'p3', name: '田中 健太', details: '21歳男性, 大学生, ガジェット好き', response: 'ダークモードとカスタマイズ性が足りない。デザインは良い。' },
       ];
       // 最初の結果セットを追加
       setResultSets([{ 
         id: 'initial', 
         title: '初期シミュレーション結果', 
         personas: initialResults 
       }]);
       setDisplayedResultSetIndex(0); // 最初の結果を表示
       // 対話開始メッセージをチャットに追加
       setChatHistory([
         {
           id: Date.now().toString(),
           role: 'ai',
           content: '初期シミュレーションが完了しました。結果について質問や、追加の分析依頼があればどうぞ。'
         }
       ]);
      // --- ここまで仮 ---
       setCurrentStep(4); // Step 5: 対話モードへ
    }, 3000); // 3秒後に結果表示 & 対話開始
  };

  // Step 2 -> Step 1 (再生成)
  const handleStep2Regenerate = (feedback?: string) => {
    console.log('再生成依頼:', feedback);
    // --- ここで本来はフィードバックと共に提案生成APIを再呼び出し ---
    // 仮実装: 
    alert('再生成機能は未実装です。フィードバック: ' + (feedback || 'なし'));
  };

  // オーケストレーターAIにメッセージを送信
  const handleSendMessageToOrchestrator = (message: string) => {
    const newUserMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: message };
    setChatHistory(prev => [...prev, newUserMessage]);

    // --- ここで本来はオーケストレーターAI APIを呼び出す ---
    // 仮のAI応答ロジック
    setTimeout(() => {
      let aiResponseContent = "";
      let proposal: ChatMessage['proposal'] | undefined = undefined;

      // 簡単なキーワードで応答を分岐
      if (message.includes('価格') || message.includes('値段')) {
        aiResponseContent = "価格感について、もっと詳しく聞いてみましょうか？";
        proposal = {
          question: "価格について追加調査",
          onConfirm: () => handleConfirmFollowUp("価格について"),
          onDeny: () => setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: '承知しました。他にご質問はありますか？' }])
        };
      } else if (message.includes('機能')) {
         aiResponseContent = "特定の機能について深掘りしますか？例えば、検索機能について聞いてみましょうか？";
         proposal = {
           question: "検索機能について追加調査",
           onConfirm: () => handleConfirmFollowUp("検索機能について"),
           onDeny: () => setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: '承知しました。他にご質問はありますか？' }])
         };
      } else {
        aiResponseContent = `「${message}」についてですね。もう少し詳しく教えていただけますか？`;
      }
      
      const newAiMessage: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: aiResponseContent,
        proposal: proposal
      };
      setChatHistory(prev => [...prev, newAiMessage]);
    }, 1500); // 1.5秒後に応答
  };

  // AIからの追加質問提案を承認
  const handleConfirmFollowUp = (followUpTopic: string) => {
     setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `${followUpTopic}に関する追加質問を開始します...` }]);
     
     // --- ここで本来はオーケストレーターがペルソナを選択し、追加質問APIを呼び出す ---
     // 仮の追加結果生成ロジック
     setTimeout(() => {
        const followUpResults: AIPersona[] = resultSets[0].personas
          .slice(0, 2)
          .map(p => ({
            ...p,
            response: followUpTopic.includes('価格') 
              ? (Math.random() > 0.5 ? '月額1000円なら払う。' : '無料プランがあれば嬉しい。') 
              : (Math.random() > 0.5 ? '検索は必須機能だと思う。' : '今のところ検索は不要。')
          }));

        const newResultSet: ResultSet = {
          id: `follow-up-${resultSets.length}`,
          title: `追加質問: ${followUpTopic}`,
          personas: followUpResults
        };

        setResultSets(prev => [...prev, newResultSet]);
        setDisplayedResultSetIndex(prev => prev + 1);
        setChatHistory(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: `${followUpTopic}に関する追加調査が完了しました。新しい結果セットをご確認ください。` }]);

     }, 4000);
  };

  // ペルソナデータを更新するハンドラー
  const handleUpdatePersona = (
    personaId: string, 
    field: keyof Omit<AIPersona, 'id'>, 
    value: string
  ) => {
    setResultSets(prevResultSets => {
      // 現在表示中の結果セットを特定
      const currentSetIndex = displayedResultSetIndex;
      // 結果セット配列全体をコピー
      const updatedResultSets = [...prevResultSets];
      // 対象の結果セットをコピー
      const targetSet = { ...updatedResultSets[currentSetIndex] };
      // 対象のペルソナ配列をコピー
      targetSet.personas = targetSet.personas.map(persona => {
        if (persona.id === personaId) {
          // 対象のペルソナを見つけたら、指定されたフィールドを更新して新しいオブジェクトを返す
          return { ...persona, [field]: value };
        }
        // 対象外のペルソナはそのまま返す
        return persona;
      });
      // 更新された結果セットで配列を置き換える
      updatedResultSets[currentSetIndex] = targetSet;
      // 新しい結果セット配列でステートを更新
      return updatedResultSets;
    });
  };

  const handleTogglePersonaSelection = (personaId: string) => {
    setSelectedPersonaIds(prev => 
      prev.includes(personaId) 
        ? prev.filter(id => id !== personaId) 
        : [...prev, personaId]
    );
  };

  // ペルソナチャットモード変更ハンドラー
  const handlePersonaChatModeChange = (checked: boolean) => {
    setIsPersonaChatMode(checked);
  };

  return (
    // Layout adjustments for full height usage
    <div className="w-full flex flex-col flex-grow bg-white px-8 pt-8 pb-8 text-gray-900">
      
      {/* メインコンテンツエリア (flex-grow を維持) */}
      <div className="w-full flex-grow flex flex-col mt-6"> 
        
        {/* Step 0, 1, 2 の表示エリア */}
        {(currentStep === 0 || currentStep === 1 || currentStep === 2) && (
          <div className="flex-grow flex justify-center items-start pt-10">
            {currentStep === 0 && <Step1_Input onSubmit={handleStep1Submit} />}
            {currentStep === 1 && aiSuggestion && (
              <Step2_Confirmation
                suggestion={aiSuggestion}
                onApprove={handleStep2Approve}
                onRegenerate={handleStep2Regenerate}
              />
            )}
            {currentStep === 2 && <Step3_Generation />}
          </div>
        )}

        {/* 結果表示エリア (ステップ3以上) (flex-grow を維持) */}
        {currentStep >= 3 && resultSets.length > 0 && (
          <div className="w-full flex flex-col items-center flex-grow">
            {/* 結果セット切り替えボタン */}
            {currentStep >= 3 && resultSets.length > 1 && (
                <div className="mb-6 flex flex-wrap justify-center gap-3 w-full">
                  {resultSets.map((set, index) => (
                    <Button 
                      key={set.id} 
                      variant={displayedResultSetIndex === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDisplayedResultSetIndex(index)}
                      className={`
                        px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                        ${displayedResultSetIndex === index 
                          ? 'bg-gray-900 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      {set.title}
                    </Button>
                  ))}
                </div>
            )}

            {/* Grid を ResizablePanelGroup に置換, flex-grow を追加 */}
            <ResizablePanelGroup 
              direction="horizontal"
              className="w-full rounded-lg border flex-grow"
            >
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-0">
                  <Step4_Results 
                    results={resultSets[displayedResultSetIndex].personas} 
                    onUpdatePersona={handleUpdatePersona} 
                    selectedPersonaIds={selectedPersonaIds}
                    onTogglePersonaSelection={handleTogglePersonaSelection}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50}>
                 {currentStep === 4 && (
                    <div className="flex h-full items-center justify-center p-0">
                      <OrchestratorChat 
                        chatHistory={chatHistory} 
                        onSendMessage={handleSendMessageToOrchestrator}
                        isPersonaMode={isPersonaChatMode}
                        onPersonaModeChange={handlePersonaChatModeChange}
                      />
                    </div>
                  )}
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </div>

    </div>
  );
} 