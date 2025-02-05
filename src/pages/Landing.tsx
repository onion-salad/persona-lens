
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat relative"
         style={{ backgroundImage: 'url("/lovable-uploads/ea2ff70a-5125-4de5-a6fa-6374225d29fb.png")' }}>
      <div className="absolute inset-0 bg-black/40" />
      
      <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
        <h1 className="text-7xl font-bold text-white mb-6">
          Persona Lens
        </h1>
        <p className="text-2xl text-gray-100 mb-12 max-w-2xl mx-auto">
          多様なペルソナの視点からウェブサイトの第一印象を分析
        </p>
        <Button 
          onClick={() => navigate("/auth")} 
          className="text-lg px-8 py-6 bg-white text-black hover:bg-white/90 transform transition hover:scale-105"
        >
          始める
        </Button>
      </div>
    </div>
  );
};

export default Landing;
