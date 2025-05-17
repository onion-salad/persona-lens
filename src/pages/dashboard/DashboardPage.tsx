"use client";

import React, { useState, useEffect } from 'react';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';
import type { ChatMessageProps } from './components/ChatMessage';
import { v4 as uuidv4 } from 'uuid';

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessageProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  useEffect(() => {
    // スレッドIDを初期化 (今回は会話ごとに新しいスレッドとするため、ページ読み込み時に生成)
    // 永続化する場合は localStorage などを使用
    const newThreadId = uuidv4();
    setCurrentThreadId(newThreadId);
    console.log("New chat thread started with ID:", newThreadId);

    // 初期メッセージ（AIからの挨拶）
    setMessages([
      {
        id: uuidv4(),
        sender: 'ai',
        personaName: 'PersonaLensアシスタント',
        content: 'こんにちは！どのような分析やお手伝いをご希望ですか？お気軽にご入力ください。',
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  const handleSendMessage = async (messageContent: string) => {
    if (!currentThreadId) {
      console.error("Thread ID is not set. Cannot send message.");
      // 必要に応じてユーザーにエラー通知
      const systemError: ChatMessageProps = {
        id: uuidv4(),
        sender: 'system',
        content: 'エラー: 会話スレッドを開始できませんでした。ページを再読み込みしてください。',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, systemError]);
      return;
    }

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
      thread_id: currentThreadId, // スレッドIDをペイロードに含める (バックエンドの仕様に合わせる)
      // resource_id: "some-resource-id", // 必要に応じて
    };

    try {
      // APIエンドポイントは `/api/chat` や `/api/orchestrator/generate` のようなものに変更することを推奨
      // ここではひとまず既存のエンドポイントを流用するが、バックエンド側の修正が必須
      const response = await fetch('/api/generate-expert-proposal', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload),
      });

      let aiResponseMessage: ChatMessageProps;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'APIから不明なエラー応答がありました。' }));
        console.error('API Error:', errorData);
        aiResponseMessage = {
          id: uuidv4(),
          sender: 'system',
          content: `エラー: ${errorData.message || response.statusText || 'サーバーとの通信に失敗しました。'}`,
          timestamp: new Date().toLocaleTimeString(),
        };
      } else {
        const result = await response.json();
        console.log('API Response:', result);
        
        // APIの応答形式に合わせて調整が必要
        // Mastra Agentの generate() の応答を期待 (result.text や result.toolResults など)
        let contentFromResult = "AIからの応答を処理できませんでした。";
        let personaNameFromResult = "AIアシスタント";

        if (result && typeof result === 'object') {
            // 対話型のエージェントの応答を想定 (例: Mastra の agent.generate() の結果)
            if (result.text) {
                contentFromResult = result.text;
            } else if (result.object && typeof result.object.message === 'string') { // OpenAI互換の .object.message など
                contentFromResult = result.object.message;
            } else if (result.message && typeof result.message === 'string') { // 直接 message プロパティがある場合
                contentFromResult = result.message;
            } else if (result.summary) { // 以前の expertProposalSchema の名残 (フォールバック)
                contentFromResult = result.summary;
                if (result.next_steps && Array.isArray(result.next_steps) && result.next_steps.length > 0) {
                    contentFromResult += "\n\n次のステップ:\n- " + result.next_steps.join("\n- ");
                }
            } else {
                contentFromResult = "AIからの応答:\n" + JSON.stringify(result, null, 2); // デバッグ用にそのまま表示
            }

            // personaName もAPI応答から取得できると良い（例: result.agentName）
        }

        aiResponseMessage = {
          id: uuidv4(),
          sender: 'ai',
          personaName: personaNameFromResult,
          content: contentFromResult,
          timestamp: new Date().toLocaleTimeString(),
        };
      }
      setMessages((prevMessages) => [...prevMessages, aiResponseMessage]);
    } catch (error) {
      console.error('Network or other error:', error);
      const systemError: ChatMessageProps = {
        id: uuidv4(),
        sender: 'system',
        content: `ネットワークエラー: ${error instanceof Error ? error.message : '不明なエラー'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, systemError]);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* 左側のチャットパネル */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col max-h-screen">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">AIアシスタント</h2>
        </div>
        <MessageList messages={messages} />
        <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>

      {/* 右側のコンテンツパネル */}
      <div className="w-2/3 flex flex-col max-h-screen">
        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">分析結果・詳細情報</h2>
        </div>
        <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-800/30">
          {/* ここにコンテンツ（例：ペルソナの回答テーブル、分析グラフなど）を表示 */}
          <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">現在の分析</h3>
            <p className="text-gray-600 dark:text-gray-300">
              AIアシスタントとの対話を通じて生成されたペルソナの回答や、その他の分析結果がここに表示されます。
              例えば、複数のペルソナからの意見をまとめたテーブルや、重要なポイントをハイライトしたサマリーなどが考えられます。
            </p>
            <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    （例：ここにペルソナの回答テーブルやグラフが表示されます）
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 