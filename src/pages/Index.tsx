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
      const { data: personasData, error: personasError } = await supabase.functions.invoke('generate-personas', {
        body: { content: submittedContent }
      });
      
      if (personasError) throw personasError;
      
      setPersonas(personasData.personas);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('persona_sessions')
        .insert([
          { 
            personas: personasData.personas,
            user_id: session?.user?.id || null
          }
        ])
        .select()
        .single();

      if (sessionError) throw sessionError;

      // 生成されたペルソナを使用してフィードバックを生成
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('generate-feedback', {
        body: { 
          content: submittedContent,
          personas: personasData.personas
        }
      });

      if (feedbackError) throw feedbackError;
      
      setFeedbacks(feedbackData.feedbacks);

      toast({
        title: "ペルソナとフィードバックを生成しました",
        description: "入力内容に基づいて適切なペルソナとフィードバックを生成しました。",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "エラーが発生しました",
        description: "ペルソナとフィードバックの生成に失敗しました。",
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
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">生成されたフィードバック</h2>
                <div className="grid grid-cols-1 gap-4">
                  {feedbacks.map((feedback, index) => (
                    <Card key={index} className="p-4">
                      <div className="mb-2">
                        <h3 className="font-semibold text-gray-700">ペルソナ {index + 1}</h3>
                        <p className="text-sm text-gray-500">{personas[index]}</p>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{feedback}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;