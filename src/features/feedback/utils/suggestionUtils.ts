import { AIPersona } from "@/pages/persona-simulation/page"; // Assuming AIPersona type is exported from here

export type ActionSuggestionCategory = 
  | "UI/UX改善" 
  | "機能追加" 
  | "コンテンツ改善" 
  | "ユーザビリティテスト"
  | "マーケティング戦略"
  | "データ収集"
  | "その他";

export type ActionSuggestionImpact = "高" | "中" | "低";
export type ActionSuggestionEffort = "高" | "中" | "低";

export type ActionSuggestion = {
  id: string;
  title: string;
  category: ActionSuggestionCategory;
  description: string;
  estimatedImpact: ActionSuggestionImpact;
  requiredEffort: ActionSuggestionEffort;
  relevantPersonaIds: string[]; // IDs of personas this suggestion is most relevant to
  tags?: string[]; // Optional tags like "Quick Win", "Strategic"
};

let suggestionIdCounter = 1;

// Improved mock data generation
export const generateMockActionSuggestions = (personas: AIPersona[]): ActionSuggestion[] => {
  const suggestions: ActionSuggestion[] = [];
  
  if (!personas || personas.length === 0) {
    return []; 
  }

  const allPersonaIds = personas.map(p => p.id);

  // Example: Generate suggestions based on persona details if possible (very basic)
  personas.forEach(persona => {
    if (persona.details.toLowerCase().includes("使いにくい") || persona.response.toLowerCase().includes("複雑")) {
      if (!suggestions.find(s => s.title === "UIの簡略化検討")) {
        suggestions.push({
          id: `sugg-${suggestionIdCounter++}`,
          title: "UIの簡略化検討",
          category: "UI/UX改善",
          description: `ペルソナ「${persona.name}」がUIの複雑さを指摘している可能性があります。ナビゲーションや情報設計を見直し、より直感的な操作フローを検討します。`,
          estimatedImpact: "高",
          requiredEffort: "中",
          relevantPersonaIds: [persona.id],
          tags: ["ユーザビリティ向上"]
        });
      }
    }
    if (persona.details.toLowerCase().includes("機能が足りない") || persona.response.toLowerCase().includes("もっとこうしたい")) {
      if (!suggestions.find(s => s.title === "新機能追加の検討")) {
        suggestions.push({
          id: `sugg-${suggestionIdCounter++}`,
          title: "新機能追加の検討",
          category: "機能追加",
          description: `ペルソナ「${persona.name}」が追加機能を求めている兆候があります。具体的なニーズを深掘りし、ロードマップへの追加を検討します。`,
          estimatedImpact: "高",
          requiredEffort: "高",
          relevantPersonaIds: [persona.id],
          tags: ["競争力強化"]
        });
      }
    }
  });

  // Fallback: Ensure at least a few generic suggestions are always present if specifics aren't generated
  if (suggestions.length < 2 && personas.length > 0) {
    suggestions.push({
      id: `sugg-${suggestionIdCounter++}`,
      title: "ユーザビリティテストの実施",
      category: "ユーザビリティテスト",
      description: "いくつかの代表的なペルソナ（例：" + (personas[0]?.name || 'ペルソナA') + "）を選定し、実際の操作シナリオに基づいたユーザビリティテストを実施して、具体的な問題点を洗い出します。",
      estimatedImpact: "高",
      requiredEffort: "中",
      relevantPersonaIds: personas.slice(0, Math.min(personas.length, 2)).map(p => p.id), // First 1-2 personas
      tags: ["課題発見"]
    });
  }

  if (suggestions.length < 3 && personas.length > 0) {
    suggestions.push({
      id: `sugg-${suggestionIdCounter++}`,
      title: "ペルソナインタビュー（深掘り）",
      category: "データ収集",
      description: "特に重要なフィードバックを示したペルソナ（複数選択可）に対して、追加のインタビューを実施し、意見の背景や具体的なニーズをより深く理解します。",
      estimatedImpact: "中",
      requiredEffort: "中",
      relevantPersonaIds: allPersonaIds, // All personas are potentially relevant
      tags: ["ニーズ理解"]
    });
  }
  
  if (suggestions.length === 0 && personas.length > 0) { // Absolute fallback if still empty
     suggestions.push({
        id: `sugg-${suggestionIdCounter++}`,
        title: "全般的なフィードバック傾向の分析",
        category: "データ収集",
        description: "すべてのペルソナからのフィードバックを総合的に見直し、共通して見られる傾向や特に注目すべき意見がないか再検討します。",
        estimatedImpact: "中",
        requiredEffort: "低",
        relevantPersonaIds: allPersonaIds,
        tags: ["全体像把握"]
      });
  }

  // Add a couple more distinct generic suggestions if total is still low
  if (suggestions.length < 4 && personas.length > 0) {
    const existingTitles = suggestions.map(s => s.title);
    if (!existingTitles.includes("競合製品の比較調査")) {
        suggestions.push({
            id: `sugg-${suggestionIdCounter++}`,
            title: "競合製品の比較調査",
            category: "マーケティング戦略",
            description: "主要な競合製品と本製品の強み・弱みを、生成されたペルソナの視点から再評価し、差別化ポイントを明確にします。",
            estimatedImpact: "中",
            requiredEffort: "中",
            relevantPersonaIds: allPersonaIds,
            tags: ["市場分析"]
        });
    }
  }
   if (suggestions.length < 4 && personas.length > 0) {
    const existingTitles = suggestions.map(s => s.title);
    if (!existingTitles.includes("ランディングページの改善提案")) {
         suggestions.push({
            id: `sugg-${suggestionIdCounter++}`,
            title: "ランディングページの改善提案",
            category: "UI/UX改善",
            description: "ペルソナのニーズに基づき、製品の価値提案をより明確に伝えるランディングページのキャッチコピーや構成案を作成します。",
            estimatedImpact: "高",
            requiredEffort: "中",
            relevantPersonaIds: personas.filter(p => p.details.toLowerCase().includes("初心者") || p.details.toLowerCase().includes("初めて")).map(p => p.id).slice(0,2), // Example targeting
            tags: ["コンバージョン率改善"]
        });
    }
  }


  // Ensure unique IDs in case of re-generation without counter reset (though ideally counter persists or is reset)
  const finalSuggestions = suggestions.reduce((acc, current) => {
    if (!acc.find(item => item.id === current.id)) {
      acc.push(current);
    }
    return acc;
  }, [] as ActionSuggestion[]);


  return finalSuggestions.slice(0, 4); // Return up to 4 suggestions
};

// Helper to get a diverse set of persona IDs
const getDiversePersonaIds = (personas: AIPersona[], count: number): string[] => {
  if (count >= personas.length) {
    return personas.map(p => p.id);
  }
  // This is a very basic attempt at diversity, a real implementation would be more sophisticated
  const shuffled = [...personas].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(p => p.id);
}; 