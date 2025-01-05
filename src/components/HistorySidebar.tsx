import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { ExecutionHistoryItem } from "@/types/feedback";
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

export function HistorySidebar() {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const { toast } = useToast();

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

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>実行履歴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {history.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton asChild>
                    <div className="flex flex-col items-start gap-1">
                      <span className="font-medium">{item.service_description}</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}