import { useState } from "react";
import { PersonaFormData } from "@/components/PersonaForm";
import { Feedback } from "@/types/feedback";

export const useStepsState = () => {
  const [personas, setPersonas] = useState<string[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [formData, setFormData] = useState<PersonaFormData | null>(null);

  const resetState = () => {
    setPersonas([]);
    setFeedbacks([]);
    setFormData(null);
  };

  return {
    personas,
    setPersonas,
    feedbacks,
    setFeedbacks,
    formData,
    setFormData,
    resetState,
  };
};