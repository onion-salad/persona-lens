import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress'; // ステップ表示用

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

// ステップ表示コンポーネント
const SimulationSteps: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = ['要望入力', '提案確認', 'ペルソナ生成', '結果表示'];
  const progressValue = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="mb-8 w-full max-w-3xl">
      <Progress value={progressValue} className="w-full mb-2" />
      <div className="flex justify-between text-sm text-gray-500">
        {steps.map((label, index) => (
          <span key={index} className={index === currentStep ? 'font-semibold text-gray-900' : ''}>
            {index + 1}. {label}
          </span>
        ))}
      </div>
    </div>
  );
};

// --- 各ステップのコンポーネント (簡易版) ---

// Step 1: 要望入力
const Step1_Input: React.FC<{ onSubmit: (request: string) => void }> = ({ onSubmit }) => {
  const [request, setRequest] = useState('');
  return (
    <Card className="w-full max-w-3xl border-gray-200">
      <CardHeader>
        <CardTitle>Step 1: シミュレーション内容の入力</CardTitle>
        <CardDescription>AI人格に評価させたい内容や、達成したいタスクを入力してください。</CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="例: 新しいタスク管理アプリの使い勝手を評価してほしい。特にUIの直感性と機能の網羅性について意見が聞きたい。"
          value={request}
          onChange={(e) => setRequest(e.target.value)}
          rows={6}
          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={() => onSubmit(request)} disabled={!request.trim()} className="bg-gray-900 hover:bg-gray-700">
          AIに提案を依頼
        </Button>
      </CardFooter>
    </Card>
  );
};

// Step 2: 提案確認 & 修正
const Step2_Confirmation: React.FC<{
  suggestion: AISuggestion;
  onApprove: () => void;
  onRegenerate: (feedback?: string) => void;
}> = ({ suggestion, onApprove, onRegenerate }) => {
  const [feedback, setFeedback] = useState('');
  // TODO: AIからの提案内容を表示するUI
  // TODO: 再生成のためのチャットUI
  return (
    <Card className="w-full max-w-3xl border-gray-200">
      <CardHeader>
        <CardTitle>Step 2: AIからの提案内容の確認</CardTitle>
        <CardDescription>AIが分析したシミュレーション計画です。内容を確認してください。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ここに提案内容を表示 */}
        <p>提案内容表示エリア (未実装)</p>
        <p>必要人数: {suggestion.selectedPersonaCount}人 (選択肢: {suggestion.personaCountOptions.join(', ')})</p>
        <p>大まかな属性: {suggestion.attributes}</p>
        <p>詳細度: {suggestion.detailLevel}</p>

        <Label htmlFor="feedback">修正指示・追加要望 (任意)</Label>
        <Textarea
          id="feedback"
          placeholder="例: もっと若年層の意見も聞きたいので、20代のペルソナを増やしてください。"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={3}
          className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
        />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onRegenerate(feedback || undefined)}>
          再生成を依頼
        </Button>
        <Button onClick={onApprove} className="bg-gray-900 hover:bg-gray-700">
          承認して次へ
        </Button>
      </CardFooter>
    </Card>
  );
};

// Step 3: ペルソナ生成中
const Step3_Generation: React.FC = () => {
  return (
    <Card className="w-full max-w-3xl border-gray-200 text-center">
      <CardHeader>
        <CardTitle>Step 3: AIペルソナ生成中</CardTitle>
        <CardDescription>承認された内容に基づき、AIペルソナを生成しています...</CardDescription>
      </CardHeader>
      <CardContent>
        {/* TODO: スピナーやプログレス表示 */}
        <p>生成中... (UI未実装)</p>
      </CardContent>
    </Card>
  );
};

// Step 4: 結果表示
const Step4_Results: React.FC<{ results: AIPersona[] }> = ({ results }) => {
  return (
    <Card className="w-full max-w-5xl border-gray-200">
      <CardHeader>
        <CardTitle>Step 4: シミュレーション結果</CardTitle>
        <CardDescription>生成されたAIペルソナとその回答です。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">ペルソナ名</TableHead>
              <TableHead>詳細情報</TableHead>
              <TableHead>回答</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500">
                  結果はまだありません。
                </TableCell>
              </TableRow>
            ) : (
              results.map((persona) => (
                <TableRow key={persona.id}>
                  <TableCell className="font-medium">{persona.name}</TableCell>
                  <TableCell className="text-sm text-gray-600 whitespace-pre-wrap">{persona.details}</TableCell>
                  <TableCell className="whitespace-pre-wrap">{persona.response}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};


// --- メインページコンポーネント --- 
export function PersonaSimulationPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [userRequest, setUserRequest] = useState<string>('');
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [personaResults, setPersonaResults] = useState<AIPersona[]>([]);

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

  // Step 2 -> Step 3 (承認)
  const handleStep2Approve = () => {
    setCurrentStep(2);
    // --- ここで本来はペルソナ生成APIを呼び出す ---
    // 仮のタイマーで Step 4 へ
    setTimeout(() => {
      // --- APIから結果取得後 --- 
       const dummyResults: AIPersona[] = [
         { id: '1', name: '佐藤 優子', details: '32歳女性, 東京在住, IT企業勤務...', response: 'UIは直感的だが、検索機能が欲しい。' },
         { id: '2', name: 'John Smith', details: '45歳男性, NY在住, マーケティングマネージャー...', response: '機能は十分だが、モバイル対応が不完全。' },
       ];
       setPersonaResults(dummyResults);
      // --- ここまで仮 ---
       setCurrentStep(3);
    }, 3000); // 3秒後に結果表示へ
  };

  // Step 2 -> Step 1 (再生成)
  const handleStep2Regenerate = (feedback?: string) => {
    console.log('再生成依頼:', feedback);
    // --- ここで本来はフィードバックと共に提案生成APIを再呼び出し ---
    // 仮実装: Step 1 に戻る (実際は新しい提案を待つ)
    // setAiSuggestion(null); // 提案をリセット
    // setCurrentStep(0); // or ローディング表示
    alert('再生成機能は未実装です。フィードバック: ' + (feedback || 'なし'));
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-var(--header-height))] flex-col items-center bg-white px-4 py-8 text-gray-900">
      <SimulationSteps currentStep={currentStep} />

      {currentStep === 0 && <Step1_Input onSubmit={handleStep1Submit} />}
      {currentStep === 1 && aiSuggestion && (
        <Step2_Confirmation
          suggestion={aiSuggestion}
          onApprove={handleStep2Approve}
          onRegenerate={handleStep2Regenerate}
        />
      )}
      {currentStep === 2 && <Step3_Generation />}
      {currentStep === 3 && <Step4_Results results={personaResults} />}

    </div>
  );
} 