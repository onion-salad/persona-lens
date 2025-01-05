import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeedbackButton = () => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-sm font-normal"
      onClick={() => window.open('https://feedbackhub.lovable.app/services/deeef857-aa16-4897-abda-045e5b8c0a14', '_blank')}
    >
      <MessageSquare className="w-4 h-4 mr-2" />
      フィードバックはこちらから
    </Button>
  );
};

export default FeedbackButton;