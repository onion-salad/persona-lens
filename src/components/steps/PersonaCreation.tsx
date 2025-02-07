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
    console.log("Starting persona generation with form data:", formData);
    setIsLoading(true);
    try {
      console.log("Invoking generate-personas function...");
      const { data: personasData, error: personasError } = await supabase.functions.invoke('generate-personas', {
        body: { 
          targetGender: formData.targetGender,
          targetAge: formData.targetAge,
          targetIncome: formData.targetIncome,
          serviceDescription: formData.serviceDescription,
          usageScene: formData.usageScene,
        }
      });
      
      console.log("Response from generate-personas:", { personasData, personasError });
      
      if (personasError) {
        console.error("Error generating personas:", personasError);
        throw personasError;
      }
      
      onPersonasGenerated(personasData.personas, formData);
      
      toast({
        title: "ペルソナを生成しました",
        description: "生成されたペルソナを確認してください。",
      });
    } catch (error) {
      console.error('Detailed error:', error);
      toast({
        title: "エラーが発生しました",
        description: "ペルソナの生成に失敗しました。",
        variant: "destructive",
      });
    } finally {
      console.log("Persona generation process completed");
      setIsLoading(false);
    }
  };

  return (
    <PersonaForm onSubmit={handlePersonaFormSubmit} isLoading={isLoading} />
  );
};

export default PersonaCreation;