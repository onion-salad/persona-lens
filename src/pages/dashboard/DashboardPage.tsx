"use client";

import React, { useState, useEffect } from 'react';
import { MessageList } from '@/features/chat/components/MessageList';
import { MessageInput } from '@/features/chat/components/MessageInput';
import type { ChatMessageProps } from '@/features/chat/components/ChatMessage';
import { v4 as uuidv4 } from 'uuid'; // 一意なID生成のため
import "@copilotkit/react-ui/styles.css"; // CopilotKitのUIスタイルをインポート
import { CopilotPopup, CopilotSidebar } from "@copilotkit/react-ui"; 

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);

  useEffect(() => {
    // 初回レンダリング時にスレッドIDを生成またはローカルストレージから取得
    const storedThreadId = localStorage.getItem('chatThreadId');
    if (storedThreadId) {
      setThreadId(storedThreadId);
    } else {
      const newThreadId = uuidv4();
      setThreadId(newThreadId);
      localStorage.setItem('chatThreadId', newThreadId);
    }

    // ダミーの初期メッセージ（開発用）
    setMessages([
      {
        id: uuidv4(),
        sender: 'ai',
        personaName: 'PersonaLens',
        content: 'こんにちは！どのようなご用件でしょうか？お手伝いできることがあれば教えてください。',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const handleSendMessage = async (messageContent: string) => {
    const userMessage: ChatMessageProps = {
      id: uuidv4(),
      sender: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    const requestPayload = {
      messages: [{ role: "user" as const, content: messageContent }],
      // threadId や resourceId も必要に応じて含めることができますが、
      // generateExpertProposal.ts 側で新規生成しているので、ここでは必須ではありません。
      // もしフロントで管理しているthreadIdを継続利用したい場合は、それを渡すようにします。
      // 今回はシンプルにするため、メッセージ内容のみを渡します。
    };

    console.log('Sending message to API:', requestPayload);

    try {
      const response = await fetch('/api/generate-expert-proposal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'APIから不正な形式のエラー応答がありました。' }));
        console.error('API Error:', errorData);
        const errorMessage = errorData.message || `APIエラーが発生しました: ${response.status}`;
        const aiErrorResponse: ChatMessageProps = {
          id: uuidv4(),
          sender: 'system',
          content: `エラー: ${errorMessage}`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prevMessages) => [...prevMessages, aiErrorResponse]);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      console.log('API Response:', result);

      // APIからの応答を整形してチャットメッセージとして表示
      // resultの構造は orchestratorAgent.ts の finalOutput に依存します。
      // ここでは、OrchestratorAgent の新しい対話型 instructions に基づいた応答を期待します。
      // 応答が直接的な回答文字列であるか、あるいは複数のステップを含むオブジェクトであるかを判断する必要があります。

      // 仮に result.text や result.choices[0].message.content のような単純なテキスト応答を期待する場合:
      // let aiContent = "AIからの応答がありませんでした。";
      // if (result && result.text) { // Mastra Agent の .generate() の直接の応答に近い形式
      //   aiContent = result.text;
      // } else if (result && result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content) { // OpenAI互換の応答形式
      //  aiContent = result.choices[0].message.content;
      // }

      // OrchestratorAgentの新しいinstructionsは、まず目的確認や計画提示の質問を返すはず。
      // そのため、result自体がオーケストレーターの発言として表示されるべき。
      // ここでは、resultが orchestratorAgent.ts の instructions に従って、
      // ユーザーへの質問や計画の提示を含むテキストを返すことを期待します。
      // 実際の orchestratorAgent.ts の最終的な出力形式に合わせて調整が必要です。
      // 現状の orchestratorAgent.ts は expertProposalSchema に整形したものを返しているので、
      // その中のユーザーへのメッセージに相当する部分（例：summary や next_steps）を使うか、
      // または orchestratorAgent の instructions に従って最初の質問を生成するように変更し、それを表示します。

      // ---- OrchestratorAgent の instructions に合わせた応答処理（案） -----
      // APIのレスポンスがオーケストレーターの直接の「発言」であると仮定します。
      // これは、API側(generateExpertProposal.ts)で、orchestratorAgent.generate() を直接呼び出し、
      // その .text や .object (ツール呼び出しがない場合) を返すように変更した場合に最もシンプルに動作します。
      // 現在の runOrchestrator は複数のツールを実行し、expertProposalSchema 形式で返すため、
      // このままでは直接的な「対話の最初の応答」とはなりにくいです。

      // ここでは、runOrchestrator が返す expertProposalSchema の summary を一旦表示してみます。
      let aiContent = "AIからの応答を処理できませんでした。";
      let personaName = "Orchestrator";

      if (result && typeof result === 'object') {
        if (result.summary) { // expertProposalSchemaのsummaryを使う場合
          aiContent = result.summary;
          if (result.next_steps && result.next_steps.length > 0) {
            aiContent += "\n\n次のステップ:\n- " + result.next_steps.join("\n- ");
          }
        } else if (result.message) { // 単純なエラーメッセージや情報メッセージの場合
            aiContent = result.message;
        } else if (result.text) { // Mastra Agentの .generate() の直接の応答の場合
            aiContent = result.text;
        } else {
            // それでも適切な内容が見つからない場合は、生のJSONを表示（デバッグ用）
            aiContent = "AIからの応答:\n" + JSON.stringify(result, null, 2);
        }
      }
      // TODO: ここで result の内容を解析し、OrchestratorAgentの対話的な応答を生成・表示する必要がある。
      // 例えば、OrchestratorAgentが「目的は明確ですか？計画を立てますか？」と質問する応答を期待。
      // そのためには、API側で runOrchestrator を使うのではなく、
      // orchestratorAgent.generate(userMessageContent, { threadId }) のような呼び出しをする必要があるかもしれない。

      const aiResponse: ChatMessageProps = {
        id: uuidv4(),
        sender: 'ai',
        personaName: personaName, 
        content: aiContent,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);

    } catch (error) {
      console.error('Network or other error:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なネットワークエラーが発生しました。';
      const aiErrorResponse: ChatMessageProps = {
        id: uuidv4(),
        sender: 'system',
        content: `エラー: ${errorMessage}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, aiErrorResponse]);
    }

    setIsLoading(false);
  };

  // TODO: ここに右側のコンテンツエリアに表示する内容を将来的に実装
  const MainContent = () => {
    return (
      <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">メインコンテンツエリア</h2>
        <p className="text-gray-600 dark:text-gray-300">
          ここに、オーケストレーターとの対話結果や、生成されたペルソナ情報、
          その他の分析結果などが表示される予定です。
        </p>
        <p className="text-gray-600 dark:text-gray-300 mt-4">
          CopilotKitのチャットインターフェースは左側に表示されます。
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 border-b dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">PersonaLens (CopilotKit Demo)</h1>
      </header>
      <div className="flex flex-grow overflow-hidden"> {/* flex-grow と overflow-hidden を親に追加 */} 
        {/* 左側のチャットエリア (CopilotKit UI) */}
        {/* CopilotSidebarを使って左側に固定表示する例 */}
        <div className="w-1/3 h-full border-r border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col"> 
            <CopilotSidebar
                labels={{
                    title: "PersonaLens Assistant",
                    initial: "こんにちは！PersonaLensアシスタントです。どのようなご用件でしょうか？",
                }}
                defaultOpen={true} // 最初から開いた状態にする
                clickOutsideToClose={false} // 外側クリックで閉じないようにする
                // ここで直接 instructions を渡せるか、あるいはCopilotKitプロバイダーのagent設定が使われるか
            >
                {/* CopilotSidebarは通常、トリガーボタンなどをchildrenに持つことを期待しないか、
                    あるいはチャットインターフェース自体を描画する。
                    ドキュメントの<CopilotPopup>のように、コンテンツを持たない場合もある。
                    もしSidebarが内部にチャットUIをレンダリングするなら、このchildrenは不要かもしれない。
                    ここでは、Sidebarが左側のコンテナとして機能し、その内部でチャットUIが表示されると期待。
                 */}
            </CopilotSidebar>
        </div>

        {/* 右側のメインコンテンツエリア */}
        <main className="flex-grow p-6 overflow-y-auto"> {/* overflow-y-autoでコンテンツが多ければスクロール */} 
          <MainContent />
        </main>

        {/* CopilotPopup を使う場合 (画面右下にポップアップとして表示) */}
        {/* <CopilotPopup
          labels={{
            title: "PersonaLens Assistant",
            initial: "Hi! I\'m connected to your Mastra orchestratorAgent. How can I help?",
          }}
        /> */}
      </div>
    </div>
  );
} 