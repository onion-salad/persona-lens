"use client";

import React from 'react';
import { cn } from '@/lib/utils'; // Shadcn/UIのユーティリティ
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface ChatMessageProps {
  id: string; // メッセージの一意なID
  sender: 'user' | 'ai' | 'system';
  content: string | React.ReactNode; // ReactNode を許容して、複雑なコンテンツも表示可能に
  timestamp?: string; // オプションでタイムスタンプ
  personaName?: string; // AIの場合のペルソナ名
}

export function ChatMessage({ id, sender, content, timestamp, personaName }: ChatMessageProps) {
  const isUser = sender === 'user';
  const isAI = sender === 'ai';

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src={isAI ? `/avatars/ai-${personaName?.toLowerCase() || 'default'}.png` : '/avatars/system.png'} alt={personaName || 'AI'} />
          <AvatarFallback>{personaName ? personaName.substring(0, 1).toUpperCase() : (isAI ? 'AI' : 'S')}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-lg px-4 py-2 break-words',
          isUser
            ? 'bg-blue-500 text-white rounded-br-none' 
            : 'bg-gray-100 text-gray-800 rounded-bl-none dark:bg-gray-700 dark:text-gray-200'
        )}
      >
        {isAI && personaName && (
          <p className="text-xs font-semibold mb-1"
             style={{ color: isUser ? 'inherit' : '#4A90E2' }} // AIのペルソナ名はテーマカラーに
          >
            {personaName}
          </p>
        )}
        {typeof content === 'string' ? (
          <p className="text-sm whitespace-pre-wrap">{content}</p>
        ) : (
          content // ReactNodeをそのままレンダリング
        )}
        {timestamp && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 text-right">
            {timestamp}
          </p>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 border">
          <AvatarImage src="/avatars/user.png" alt="User" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// デフォルトアバター用の画像パスの例（public/avatars/ 以下に配置想定）
// /avatars/ai-default.png
// /avatars/ai-somepersona.png
// /avatars/system.png
// /avatars/user.png 