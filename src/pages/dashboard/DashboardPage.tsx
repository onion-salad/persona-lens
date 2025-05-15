"use client";

import React, { useState, useEffect } from 'react';
import { MessageList } from '@/features/chat/components/MessageList';
import { MessageInput } from '@/features/chat/components/MessageInput';
import type { ChatMessageProps } from '@/features/chat/components/ChatMessage';
import { v4 as uuidv4 } from 'uuid'; // 一意なID生成のため

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

    console.log('Sending message to orchestrator:', {
      message: messageContent,
      threadId: threadId,
      // resourceId: null, // 必要に応じて
    });

    // --- ここからAPI呼び出しのダミー処理 ---
    // 実際にはここでAPIを呼び出し、オーケストレーターからの応答を取得します。
    // const response = await fetch('/api/orchestrate', { // 例
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: messageContent, threadId, resourceId: null }),
    // });
    // const data = await response.json();
    // --- ここまでAPI呼び出しのダミー処理 ---

    // ダミーのAI応答
    setTimeout(() => {
      const aiResponse: ChatMessageProps = {
        id: uuidv4(),
        sender: 'ai',
        personaName: 'Orchestrator',
        content: `「${messageContent}」についてですね。確認します。
（現在はダミー応答です。実際のオーケストレーターの応答はここに表示されます。）`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-md p-4 border-b dark:border-gray-700">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">PersonaLens Chat</h1>
      </header>
      <MessageList messages={messages} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
} 