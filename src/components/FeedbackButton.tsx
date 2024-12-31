import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

const FeedbackButton = () => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed top-4 right-4 z-50"
      onClick={() => window.open('https://feedbackhub.lovable.app/services/deeef857-aa16-4897-abda-045e5b8c0a14', '_blank')}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      フィードバック
    </Button>
  );
};

export default FeedbackButton;