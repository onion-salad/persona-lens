import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { ExecutionHistoryItem, SupabaseExecutionHistory, SupabaseFeedback } from "@/types/feedback";

const Dashboard = () => {
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

      // データの型を変換
      const typedData: ExecutionHistoryItem[] = (data as any[])?.map(item => ({
        ...item,
        personas: Array.isArray(item.personas) ? item.personas.map(String) : [],
        feedbacks: Array.isArray(item.feedbacks) 
          ? (item.feedbacks as any[]).map(f => ({
              persona: String(f.persona),
              feedback: {
                firstImpression: String(f.feedback.firstImpression),
                appealPoints: f.feedback.appealPoints.map(String),
                improvements: f.feedback.improvements.map(String),
                summary: String(f.feedback.summary)
              },
              selectedImageUrl: f.selectedImageUrl ? String(f.selectedImageUrl) : null
            }))
          : []
      })) || [];

      setHistory(typedData);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast({
        title: "エラーが発生しました",
        description: "履歴の取得に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "yyyy年MM月dd日 HH:mm", { locale: ja });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">実行履歴</h1>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-6">
            {history.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">
                        {item.service_description}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="font-medium mb-2">ターゲット情報</h3>
                      <ul className="text-sm space-y-1">
                        <li>性別: {item.target_gender}</li>
                        <li>年齢: {item.target_age}</li>
                        <li>年収: {item.target_income}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">利用シーン</h3>
                      <p className="text-sm">{item.usage_scene}</p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2">生成されたペルソナ数</h3>
                      <p className="text-sm">{item.personas.length}人</p>
                    </div>
                  </div>
                  {item.feedbacks && (
                    <div>
                      <h3 className="font-medium mb-2">フィードバック数</h3>
                      <p className="text-sm">{item.feedbacks.length}件</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Dashboard;