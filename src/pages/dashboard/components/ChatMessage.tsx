"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// export type Sender = 'user' | 'ai' | 'system'; // グローバルな型定義ファイルに移動も検討

export interface ChatMessageProps {
  id: string;
  sender: 'user' | 'ai' | 'system';
  content: string | React.ReactNode; 
  timestamp?: string;
  personaName?: string; 
  // 必要に応じて他のメタデータ（例：引用元、関連情報など）も追加可能
}

export function ChatMessage({ id, sender, content, timestamp, personaName }: ChatMessageProps) {
  const isUser = sender === 'user';
  const isAI = sender === 'ai';
  const isSystem = sender === 'system';

  // アバターのフォールバックテキストを生成
  let fallbackText = 'S'; // System default
  if (isUser) fallbackText = 'U';
  else if (isAI) fallbackText = personaName ? personaName.substring(0, 1).toUpperCase() : 'AI';

  // アバター画像のパス（仮）
  // public/avatars/ ディレクトリに配置することを想定
  let avatarSrc = '/avatars/system.png'; // System default
  if (isUser) avatarSrc = '/avatars/user.png';
  else if (isAI) avatarSrc = `/avatars/ai-${personaName?.toLowerCase().replace(/\s+/g, '-') || 'default'}.png`; 
  // personaName が "Persona Lens" の場合 -> /avatars/ai-persona-lens.png

  return (
    <div
      className={cn(
        'flex items-start gap-3 py-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* AIまたはSystemのメッセージの場合、左側にアバターを表示 */}
      {!isUser && (
        <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-600">
          <AvatarImage src={avatarSrc} alt={personaName || sender} />
          <AvatarFallback className="text-sm">{fallbackText}</AvatarFallback>
        </Avatar>
      )}

      {/* メッセージバルーン */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm',
          isUser
            ? 'bg-blue-600 text-white rounded-br-none' 
            : (isSystem 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-bl-none dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-600' 
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600'),
          isSystem && 'italic' // システムメッセージはイタリックに
        )}
      >
        {isAI && personaName && (
          <p className="text-xs font-semibold mb-1 text-blue-700 dark:text-blue-400">
            {personaName}
          </p>
        )}
        {typeof content === 'string' ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          content // ReactNodeをそのままレンダリング
        )}
        {timestamp && (
          <p className={cn(
            "mt-1.5 text-xs",
            isUser ? "text-blue-200" : "text-gray-400 dark:text-gray-500",
            "text-right"
            )}>
            {timestamp}
          </p>
        )}
      </div>

      {/* ユーザーのメッセージの場合、右側にアバターを表示 */}
      {isUser && (
        <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-600">
          <AvatarImage src={avatarSrc} alt="User" />
          <AvatarFallback className="text-sm">{fallbackText}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
} 