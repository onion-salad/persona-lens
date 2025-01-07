import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeedbackButton = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="fixed bottom-4 right-4 z-50 bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white/90"
      onClick={() => window.open('https://feedbackhub.lovable.app/services/deeef857-aa16-4897-abda-045e5b8c0a14', '_blank')}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      フィードバックはこちらから
    </Button>
  );
};

export default FeedbackButton;