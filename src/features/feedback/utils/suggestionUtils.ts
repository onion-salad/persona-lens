import { type AIPersona } from '../../../pages/persona-simulation/page'; // Adjust path if necessary

// Define the structure for an action suggestion
export type ActionSuggestion = {
  id: string;
  category: 'UI/UX' | 'Functionality' | 'Pricing' | 'Performance' | 'Content' | 'Other';
  suggestion: string;
  rationale: string; // Brief explanation linking to feedback
  relatedPersonaIds: string[]; // IDs of personas whose feedback inspired this
};

// Mock function to generate action suggestions based on persona feedback
export function generateMockActionSuggestions(
  personas: AIPersona[]
): ActionSuggestion[] {
  const suggestions: ActionSuggestion[] = [];
  if (!personas || personas.length === 0) {
    return suggestions;
  }

  const keywordMap: { [key: string]: Omit<ActionSuggestion, 'id' | 'relatedPersonaIds'> } = {
    '難しい': { category: 'UI/UX', suggestion: '操作チュートリアルやガイドの追加', rationale: '一部のユーザーが操作の難しさを感じています。' },
    '分かりにくい': { category: 'UI/UX', suggestion: 'UI要素のラベルや配置の見直し', rationale: '特定の機能や情報の場所が不明瞭なようです。' },
    '遅い': { category: 'Performance', suggestion: 'パフォーマンスの最適化（ロード時間短縮など）', rationale: '動作速度に関する指摘が見られます。' },
    '欲しい': { category: 'Functionality', suggestion: '新機能の検討（具体的な要望を別途集約）', rationale: 'ユーザーからの機能追加要望があります。' },
    '足りない': { category: 'Functionality', suggestion: '既存機能の拡充・改善', rationale: '現在の機能ではニーズを満たせない可能性があります。' },
    '価格': { category: 'Pricing', suggestion: '価格設定やプラン内容の見直し', rationale: '価格に関する意見が見られます。' },
    '高い': { category: 'Pricing', suggestion: '価格設定やプラン内容の見直し', rationale: '価格が競合や価値に見合わないと感じている可能性があります。' },
    'デザイン': { category: 'UI/UX', suggestion: 'デザインの一貫性や魅力の向上', rationale: 'デザインに関する具体的な意見があります。' },
    '改善': { category: 'Other', suggestion: '具体的な改善点の特定と対応', rationale: 'ユーザーから直接的な改善要望が挙がっています。' },
    '問題': { category: 'Other', suggestion: '指摘された問題点の調査と修正', rationale: '具体的な問題点が報告されています。' },
    'バグ': { category: 'Functionality', suggestion: '報告されたバグの修正', rationale: 'バグと思われる挙動の報告があります。' },
  };

  const generatedSuggestions: { [key: string]: ActionSuggestion } = {};

  for (const persona of personas) {
    const combinedFeedback = `${persona.details} ${persona.response}`.toLowerCase();
    
    for (const keyword in keywordMap) {
      if (combinedFeedback.includes(keyword)) {
        const suggestionTemplate = keywordMap[keyword];
        const suggestionKey = `${suggestionTemplate.category}-${suggestionTemplate.suggestion}`;

        if (!generatedSuggestions[suggestionKey]) {
          generatedSuggestions[suggestionKey] = {
            ...suggestionTemplate,
            id: `sugg-${Object.keys(generatedSuggestions).length + 1}`,
            relatedPersonaIds: [persona.id],
          };
        } else {
          // Avoid adding duplicate persona IDs
          if (!generatedSuggestions[suggestionKey].relatedPersonaIds.includes(persona.id)) {
             generatedSuggestions[suggestionKey].relatedPersonaIds.push(persona.id);
          }
        }
      }
    }
  }

  return Object.values(generatedSuggestions);
} 