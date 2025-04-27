
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  content: string;
  type: string;
}

interface PersonaSuggestionsProps {
  suggestions: Suggestion[];
  onAccept: (suggestion: Suggestion) => void;
  currentValue?: string;
}

export const PersonaSuggestions = ({ 
  suggestions, 
  onAccept, 
  // eslint-disable-next-line no-unused-vars
  currentValue 
}: PersonaSuggestionsProps) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<string[]>([]);

  const handleAccept = () => {
    if (selectedSuggestion) {
      onAccept(selectedSuggestion);
      setAcceptedSuggestions([...acceptedSuggestions, selectedSuggestion.id]);
      setSelectedSuggestion(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">AIの提案</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            className={cn(
              "cursor-pointer transition-all",
              selectedSuggestion?.id === suggestion.id
                ? "ring-2 ring-primary"
                : "hover:shadow-md",
              acceptedSuggestions.includes(suggestion.id) &&
                "opacity-50"
            )}
            onClick={() => setSelectedSuggestion(suggestion)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">提案 #{suggestion.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{suggestion.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {selectedSuggestion && (
        <div className="flex justify-end">
          <Button onClick={handleAccept} className="ml-auto">
            適用する
          </Button>
        </div>
      )}
    </div>
  );
};

// 使用例はコメントアウト
/*
const ExampleUsage = () => {
  const [fieldValue, setFieldValue] = useState("");
  const suggestions = [
    {
      id: "1",
      content: "35歳、マーケティングマネージャー、デジタルマーケティングに精通している",
      type: "demographic"
    },
    {
      id: "2",
      content: "27歳、フリーランスデザイナー、クリエイティブでトレンドに敏感",
      type: "demographic"
    },
    {
      id: "3",
      content: "42歳、IT企業役員、テクノロジー愛好家で早期採用者",
      type: "demographic"
    }
  ];

  const handleAcceptSuggestion = (suggestion: Suggestion) => {
    setFieldValue(suggestion.content);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium">プロフィール</label>
        <textarea
          value={fieldValue}
          onChange={(e) => setFieldValue(e.target.value)}
          className="mt-1 w-full rounded-md border-gray-300 shadow-sm"
          rows={3}
        />
      </div>
      
      <PersonaSuggestions
        suggestions={suggestions}
        onAccept={handleAcceptSuggestion}
        currentValue={fieldValue}
      />
    </div>
  );
};
*/
