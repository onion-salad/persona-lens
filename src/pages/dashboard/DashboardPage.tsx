"use client";

import React from 'react';

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* 左側のチャットパネル */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">チャット</h2>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
          {/* チャットメッセージリストのプレースホルダー */}
          <p className="text-sm text-gray-500 dark:text-gray-400">チャットメッセージがここに表示されます。</p>
        </div>
        <div className="p-4 border-t dark:border-gray-700">
          {/* チャット入力のプレースホルダー */}
          <input 
            type="text" 
            placeholder="メッセージを入力..."
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
      </div>

      {/* 右側のコンテンツパネル */}
      <div className="w-2/3 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">コンテンツ</h2>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
          {/* コンテンツ表示エリアのプレースホルダー */}
          <p className="text-sm text-gray-500 dark:text-gray-400">メインコンテンツがここに表示されます。</p>
          <p className="mt-4">例えば、ペルソナの回答や分析結果などが表示されるエリアです。</p>
        </div>
      </div>
    </div>
  );
} 