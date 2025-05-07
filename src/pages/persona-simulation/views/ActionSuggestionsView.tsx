import React from 'react';
import { type ActionSuggestion } from '../../../features/feedback/utils/suggestionUtils';
import { type AIPersona } from '../page'; // Import AIPersona to potentially link to details
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionSuggestionsViewProps {
  suggestions: ActionSuggestion[];
  personasMap: Map<string, AIPersona>; // Pass a map for easy persona lookup by ID
  onViewPersona?: (personaId: string) => void; // Callback to view persona details
  onBack?: () => void; // Callback to go back to the previous view
}

const ActionSuggestionsView: React.FC<ActionSuggestionsViewProps> = ({
  suggestions,
  personasMap,
  onViewPersona,
  onBack,
}) => {

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    const category = suggestion.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(suggestion);
    return acc;
  }, {} as Record<ActionSuggestion['category'], ActionSuggestion[]>);

  const categories = Object.keys(groupedSuggestions) as ActionSuggestion['category'][];

  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">
        <div>
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>AIによる改善アクションの提案はありませんでした。</p>
          {onBack && <Button variant="outline" onClick={onBack} className="mt-4">戻る</Button>}
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-6 h-6 text-gray-500" />
            <h2 className="text-xl font-semibold text-gray-800">改善アクション提案</h2>
          </div>
          {onBack && <Button variant="outline" size="sm" onClick={onBack}>戻る</Button>}
        </div>

        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 capitalize">{category}</h3>
            <div className="grid grid-cols-1 gap-4">
              {groupedSuggestions[category].map((suggestion) => (
                <Card key={suggestion.id} className="shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <CardTitle className="text-base font-medium text-gray-900">{suggestion.suggestion}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-4 space-y-3">
                    <p className="text-sm text-gray-600">{suggestion.rationale}</p>
                    {suggestion.relatedPersonaIds.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-500 mr-1">関連ペルソナ:</span>
                        {suggestion.relatedPersonaIds.map((personaId) => {
                          const persona = personasMap.get(personaId);
                          return persona ? (
                            <TooltipProvider key={personaId} delayDuration={100}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-gray-200"
                                            onClick={() => onViewPersona && onViewPersona(personaId)}
                                        >
                                            {persona.name}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs bg-gray-800 text-white border-none shadow-lg rounded px-2 py-1">
                                        クリックして詳細表示
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                          ) : null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ActionSuggestionsView; 