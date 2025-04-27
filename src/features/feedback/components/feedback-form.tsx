import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ThumbsUp } from "lucide-react";

interface FeedbackFormProps {
  personaId: string;
  onSubmit: (feedbackData: any) => void;
}

interface AspectValues {
  relevance: number;
  creativity: number;
  diversity: number;
  usefulness: number;
}

export const FeedbackForm = ({ personaId, onSubmit }: FeedbackFormProps) => {
  const [rating, setRating] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [aspects, setAspects] = useState({
    relevance: 3,
    creativity: 3,
    diversity: 3,
    usefulness: 3,
  });

  const handleRatingChange = (value: number[]) => {
    setRating(value[0]);
  };

  const handleFeedbackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
  };

  const handleAspectChange = (aspect: keyof AspectValues, value: number[]) => {
    setAspects({
      ...aspects,
      [aspect]: value[0],
    });
  };

  const handleSubmit = () => {
    if (submitted) return;

    const feedbackData = {
      personaId,
      rating,
      feedback,
      aspects, // Type errorを修正
      timestamp: new Date().toISOString(),
    };
    
    onSubmit(feedbackData); // Type errorを修正
    
    setSubmitted(true);
    setRating(3);
    setFeedback("");
    setAspects({
      relevance: 3,
      creativity: 3,
      diversity: 3,
      usefulness: 3,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="rating">総合評価</Label>
          <Slider
            id="rating"
            defaultValue={[rating]}
            max={5}
            min={1}
            step={1}
            onValueChange={handleRatingChange}
            disabled={submitted}
          />
          <p className="text-sm text-muted-foreground">
            {rating} / 5
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="feedback">フィードバック</Label>
          <Textarea
            id="feedback"
            placeholder="ご意見をお聞かせください"
            value={feedback}
            onChange={handleFeedbackChange}
            disabled={submitted}
          />
        </div>
        <div className="space-y-2">
          <Label>詳細評価</Label>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="relevance">関連性</Label>
              <Slider
                id="relevance"
                defaultValue={[aspects.relevance]}
                max={5}
                min={1}
                step={1}
                onValueChange={(value) => handleAspectChange("relevance", value)}
                disabled={submitted}
              />
              <p className="text-sm text-muted-foreground">
                {aspects.relevance} / 5
              </p>
            </div>
            <div>
              <Label htmlFor="creativity">創造性</Label>
              <Slider
                id="creativity"
                defaultValue={[aspects.creativity]}
                max={5}
                min={1}
                step={1}
                onValueChange={(value) => handleAspectChange("creativity", value)}
                disabled={submitted}
              />
              <p className="text-sm text-muted-foreground">
                {aspects.creativity} / 5
              </p>
            </div>
            <div>
              <Label htmlFor="diversity">多様性</Label>
              <Slider
                id="diversity"
                defaultValue={[aspects.diversity]}
                max={5}
                min={1}
                step={1}
                onValueChange={(value) => handleAspectChange("diversity", value)}
                disabled={submitted}
              />
              <p className="text-sm text-muted-foreground">
                {aspects.diversity} / 5
              </p>
            </div>
            <div>
              <Label htmlFor="usefulness">有用性</Label>
              <Slider
                id="usefulness"
                defaultValue={[aspects.usefulness]}
                max={5}
                min={1}
                step={1}
                onValueChange={(value) => handleAspectChange("usefulness", value)}
                disabled={submitted}
              />
              <p className="text-sm text-muted-foreground">
                {aspects.usefulness} / 5
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={submitted}>
          {submitted ? (
            <>
              送信済み <ThumbsUp className="ml-2 h-4 w-4" />
            </>
          ) : (
            "送信"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
