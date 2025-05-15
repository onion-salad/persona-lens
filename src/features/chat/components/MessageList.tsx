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
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4 text-gray-500">
        <p className="text-lg">まだメッセージはありません。</p>
        <p className="text-sm">最初のメッセージを送信してみましょう！</p>
      </div>
    );
  }

  return (
    <div ref={scrollAreaRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} {...msg} />
      ))}
    </div>
  );
} 