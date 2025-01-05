import { useState } from "react";
import PersonaForm, { PersonaFormData } from "@/components/PersonaForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonaCreationProps {
  onPersonasGenerated: (personas: string[], formData: PersonaFormData) => void;
}

const PersonaCreation = ({ onPersonasGenerated }: PersonaCreationProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePersonaFormSubmit = async (formData: PersonaFormData) => {
    setIsLoading(true);
    try {
      const { data: personasData, error: personasError } = await supabase.functions.invoke('generate-personas', {
        body: { 
          targetGender: formData.targetGender,
          targetAge: formData.targetAge,
          targetIncome: formData.targetIncome,
          serviceDescription: formData.serviceDescription,
          usageScene: formData.usageScene,
        }
      });
      
      if (personasError) throw personasError;

      // ペルソナ生成が完了したら、実行履歴にも保存
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const historyData = {
          target_gender: formData.targetGender,
          target_age: formData.targetAge,
          target_income: formData.targetIncome,
          service_description: formData.serviceDescription,
          usage_scene: formData.usageScene,
          personas: personasData.personas,
          user_id: user.id,
          feedbacks: [] // 初期状態は空配列
        };

        const { error: historyError } = await supabase
          .from("execution_history")
          .insert([historyData]);

        if (historyError) {
          console.error('Error saving history:', historyError);
        }
      }
      
      onPersonasGenerated(personasData.personas, formData);
      
      toast({
        title: "ペルソナを生成しました",
        description: "生成されたペルソナを確認してください。",
      });
    } catch (error) {
      console.error('Error:', error);
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
    <PersonaForm onSubmit={handlePersonaFormSubmit} isLoading={isLoading} />
  );
};

export default PersonaCreation;