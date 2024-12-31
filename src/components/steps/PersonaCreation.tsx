import { useState } from "react";
import PersonaForm, { PersonaFormData } from "@/components/PersonaForm";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PersonaCreationProps {
  onPersonasGenerated: (personas: string[]) => void;
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
      
      onPersonasGenerated(personasData.personas);
      
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