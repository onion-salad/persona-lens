import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import PersonaList from "@/components/PersonaList";
import FeedbackForm from "@/components/FeedbackForm";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const { toast } = useToast();

  const generatePersonas = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-personas');
      
      if (error) throw error;
      
      setPersonas(data.personas);
      
      // セッションをデータベースに保存
      const { data: sessionData, error: sessionError } = await supabase
        .from('persona_sessions')
        .insert([
          { personas: data.personas }
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast({
        title: "ペルソナを生成しました",
        description: "10名のペルソナが作成されました。",
      });
    } catch (error) {
      console.error('Error generating personas:', error);
      toast({
        title: "エラーが発生しました",
        description: "ペルソナの生成に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ペルソナフィードバックジェネレーター
          </h1>
          <p className="text-lg text-gray-600">
            Gemini APIを使用して10名のペルソナを生成し、フィードバックを取得します
          </p>
        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <Button
              onClick={generatePersonas}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              ペルソナを生成する
            </Button>
          </Card>

          {personas.length > 0 && (
            <>
              <PersonaList personas={personas} />
              <FeedbackForm
                personas={personas}
                onFeedbackReceived={setFeedbacks}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;