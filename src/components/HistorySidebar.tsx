import { History } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface ExecutionHistoryItem {
  id: string;
  target_gender: string;
  target_age: string;
  target_income: string;
  service_description: string;
  usage_scene: string;
  personas: string[];
  feedbacks: any[];
  created_at: string;
}

export function HistorySidebar() {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("execution_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setHistory(data || []);
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