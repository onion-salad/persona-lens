
import { useState } from "react";
import PersonaForm, { PersonaFormData } from "@/components/PersonaForm";
import { useToast } from "@/components/ui/use-toast";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey } from "@/utils/apiKey";
import { PERSONA_GENERATION_PROMPT, replacePromptParams } from "@/constants/prompts";

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
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("APIキーが設定されていません");
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const promptParams = {
        targetGender: formData.targetGender,
        targetAge: formData.targetAge,
        targetIncome: formData.targetIncome,
        serviceDescription: formData.serviceDescription,
        usageScene: formData.usageScene,
      };

      const prompt = replacePromptParams(PERSONA_GENERATION_PROMPT, promptParams);
      console.log("Sending prompt to Gemini:", prompt);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      console.log("Received response from Gemini:", text);

      // テキストを行で分割し、空行を除去して配列に変換
      const personas = text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .map(line => line.trim());

      console.log("Generated personas:", personas);
      
      onPersonasGenerated(personas, formData);
      
      toast({
        title: "ペルソナを生成しました",
        description: "生成されたペルソナを確認してください。",
      });
    } catch (error) {
      console.error('Error generating personas:', error);
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "ペルソナの生成に失敗しました。",
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
