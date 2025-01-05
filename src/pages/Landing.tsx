import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeedbackButton from "@/components/FeedbackButton";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/steps");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <FeedbackButton />
      
      <div className="max-w-4xl mx-auto text-center px-4">
        <h1 className="text-7xl font-bold text-gray-900 mb-6">
          Persona Lens
        </h1>
        <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto">
          多様なペルソナの視点からウェブサイトの第一印象を分析
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          className="text-lg px-8 py-6 bg-black text-white hover:bg-black/90 transform transition hover:scale-105"
        >
          始める
        </Button>
      </div>
    </div>
  );
};

export default Landing;