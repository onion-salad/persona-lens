"use client";

import React, { useEffect, useRef } from 'react';
import { ChatMessage, type ChatMessageProps } from './ChatMessage';

interface MessageListProps {
  messages: ChatMessageProps[];
}

export function MessageList({ messages }: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // スムーズスクロールではなく、即時スクロールで一番下に移動
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
        {/* <img src="/icons/chat-bubble.svg" alt="" className="w-16 h-16 mb-4 text-gray-400" /> */}
        {/* ↑ 将来的にアイコンを追加する場所のコメント */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.86 8.25-8.625 8.25S3.75 16.556 3.75 12s3.86-8.25 8.625-8.25S21 7.444 21 12z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">まだメッセージはありません</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          最初のメッセージを送信して、AIアシスタントとの会話を始めましょう。
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollAreaRef} className="flex-grow overflow-y-auto p-4 space-y-1 bg-gray-50 dark:bg-gray-800/50">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} {...msg} />
      ))}
    </div>
  );
} 