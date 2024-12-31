import { useState } from "react";
import { Card } from "@/components/ui/card";
import PersonaList from "@/components/PersonaList";
import FeedbackForm from "@/components/FeedbackForm";
import ContentForm from "@/components/ContentForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState("");
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<string[]>([]);
  const { toast } = useToast();

  const handleContentSubmit = async (submittedContent: string) => {
    setIsLoading(true);
    setContent(submittedContent);

    try {
      const { data, error } = await supabase.functions.invoke('generate-personas', {
        body: { content: submittedContent }
      });
      
      if (error) throw error;
      
      setPersonas(data.personas);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('persona_sessions')
        .insert([
          { 
            personas: data.personas,
            user_id: session?.user?.id || null
          }
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      toast({
        title: "ペルソナを生成しました",
        description: "入力内容に基づいて適切なペルソナを生成しました。",
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
            フィードバックを受けたい内容を入力し、適切なペルソナからのフィードバックを取得します
          </p>
        </div>

        <div className="space-y-8">
          <ContentForm 
            onContentSubmit={handleContentSubmit}
            isLoading={isLoading}
          />

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