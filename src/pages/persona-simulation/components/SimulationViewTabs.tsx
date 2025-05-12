import React from 'react';
import { type SimulationView } from '../page'; // SimulationView型をインポート
import { Button } from "@/components/ui/button"; // Buttonを使用
import { cn } from '@/lib/utils'; // cnユーティリティをインポート

interface SimulationViewMenuItem { // SimulationViewTab から名称変更
  view: SimulationView;
  label: string;
  icon?: React.ElementType;
}

interface SimulationViewVerticalMenuProps { // Props名も変更
  currentView: SimulationView;
  onMenuChange: (view: SimulationView) => void; // onTabChange から名称変更
  availableMenuItems: SimulationViewMenuItem[]; // availableTabs から名称変更
  className?: string;
}

export const SimulationViewVerticalMenu: React.FC<SimulationViewVerticalMenuProps> = ({ // コンポーネント名も変更 SimulationViewTabs から
  currentView,
  onMenuChange,
  availableMenuItems,
  className,
}) => {
  if (!availableMenuItems || availableMenuItems.length === 0) {
    return null;
  }

  return (
    // 画面右下に固定するためのコンテナ
    <div className={cn("fixed bottom-4 right-4 z-50 p-2 bg-background/80 backdrop-blur-sm border rounded-lg shadow-xl space-y-1", className)}>
      {availableMenuItems.map((itemInfo) => (
        <Button
          key={itemInfo.view}
          variant={currentView === itemInfo.view ? "default" : "ghost"} // アクティブな項目は "default" スタイル
          size="sm" // 少し小さめのボタン
          onClick={() => onMenuChange(itemInfo.view)}
          className="w-full flex items-center justify-start text-sm px-3 py-2" // 左寄せでアイコンとテキストを配置
        >
          {itemInfo.icon && <itemInfo.icon className="w-4 h-4 mr-2 flex-shrink-0" />} 
          <span className="truncate">{itemInfo.label}</span>
        </Button>
      ))}
    </div>
  );
}; 