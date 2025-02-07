import { useState } from "react";
import PersonaForm, { PersonaFormData } from "@/components/PersonaForm";
import { useToast } from "@/components/ui/use-toast";

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
      // モックのペルソナデータを生成
      const mockPersonas = [
        "20代後半の会社員、新しい技術に興味がある",
        "30代前半の主婦、効率的な生活を心がける",
        "40代のビジネスマン、品質とコスパを重視"
      ];
      
      onPersonasGenerated(mockPersonas, formData);
      
      toast({
        title: "ペルソナを生成しました",
        description: "生成されたペルソナを確認してください。",
      });
    } catch (error) {
      console.error('Error generating personas:', error);
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