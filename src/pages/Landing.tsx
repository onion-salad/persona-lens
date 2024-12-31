import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import FeedbackButton from "@/components/FeedbackButton";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: "url('/lovable-uploads/a7897bdf-655d-46b8-b190-acbfad79648c.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
      
      <FeedbackButton />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4">
        <h1 className="text-7xl font-bold text-white mb-6">
          Persona Lens
        </h1>
        <p className="text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          多様なペルソナの視点からウェブサイトの第一印象を分析
        </p>
        <Button 
          onClick={() => navigate("/steps")} 
          className="text-lg px-8 py-6 bg-white text-gray-900 hover:bg-white/90 transform transition hover:scale-105"
        >
          分析を開始する
        </Button>
      </div>
    </div>
  );
};

export default Landing;