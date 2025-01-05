import { History, ArrowRight, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ExecutionHistoryItem } from "@/types/feedback";
import FeedbackButton from "./FeedbackButton";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface HistorySidebarProps {
  onHistorySelect?: (history: ExecutionHistoryItem) => void;
}

export function HistorySidebar({ onHistorySelect }: HistorySidebarProps) {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("execution_history")
        .select("*")
        .eq('user_id', user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // データの型を変換
      const typedData: ExecutionHistoryItem[] = data?.map(item => {
        const personas = Array.isArray(item.personas) 
          ? item.personas.map(p => String(p)) 
          : [];

        const feedbacks = Array.isArray(item.feedbacks) 
          ? item.feedbacks.map((f: any) => ({
              persona: String(f.persona),
              feedback: {
                firstImpression: String(f.feedback.firstImpression),
                appealPoints: f.feedback.appealPoints.map(String),
                improvements: f.feedback.improvements.map(String),
                summary: String(f.feedback.summary)
              },
              selectedImageUrl: f.selectedImageUrl ? String(f.selectedImageUrl) : undefined
            }))
          : [];

        return {
          ...item,
          personas,
          feedbacks,
        };
      }) || [];

      setHistory(typedData);
      
      // 最新の履歴の自動選択を削除
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "エラーが発生しました",
        description: "履歴の取得に失敗しました。",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "yyyy年MM月dd日 HH:mm", { locale: ja });
  };

  const handleHistoryClick = (item: ExecutionHistoryItem) => {
    if (onHistorySelect) {
      setCurrentHistoryId(item.id);
      onHistorySelect(item);
    }
  };

  const handleNewConversation = async () => {
    setCurrentHistoryId(null);
    navigate("/steps", { 
      replace: true,
      state: { 
        reset: true,
        timestamp: new Date().getTime() 
      }
    });
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <div className="p-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={handleNewConversation}
            >
              <PlusCircle className="h-4 w-4" />
              新しい会話を始める
            </Button>
          </div>
          <SidebarGroupLabel>実行履歴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {history.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => handleHistoryClick(item)}
                        className={`w-full min-h-[80px] p-4 transition-colors hover:bg-accent group
                          ${currentHistoryId === item.id ? 'bg-accent/50 border-l-4 border-primary' : ''}`}
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex flex-col items-start gap-2">
                            <span className="font-medium line-clamp-2">{item.service_description}</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                          <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </SidebarMenuButton>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">実行詳細</h4>
                        <div className="text-sm">
                          <p>ターゲット: {item.target_gender} / {item.target_age}</p>
                          <p>年収: {item.target_income}</p>
                          <p>利用シーン: {item.usage_scene}</p>
                          <p>生成ペルソナ: {item.personas.length}人</p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto p-4 border-t">
        <FeedbackButton />
      </div>
    </Sidebar>
  );
}