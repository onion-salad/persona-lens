// Placeholder for relationship calculation utilities

import { type AIPersona } from '../../pages/persona-simulation/page'; // Adjust path if page.tsx exports this type, or define locally
import { type Node, type Edge } from 'reactflow';

// ストップワードのリスト (関係性算出時に無視する一般的な単語)
const STOP_WORDS = new Set([
  'です', 'ます', 'こと', 'もの', 'それ', 'あれ', 'これ', 'ので', 'から', 'そして', 'また',
  'しかし', 'だが', 'けど', 'ため', 'なので', 'に対して', 'について', '関して', 'ように',
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'can', 'could', 'may', 'might', 'must',
  'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'just', 'don',
  'shouldve', 'now', 'd', 'll', 'm', 'o', 're', 've', 'y', 'ain', 'aren', 'couldn',
  'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'ma', 'mightn', 'mustn',
  'needn', 'shan', 'shouldn', 'wasn', 'weren', 'won', 'wouldn', 'i', 'you', 'he', 'she',
  'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
  'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'myself', 'yourself', 'himself',
  'herself', 'itself', 'ourselves', 'themselves',
  // Consider app-specific common words like 'アプリ', 'ユーザー', '機能' if they don't add much value to relationship
]);

// Helper function to extract keywords from persona details
function extractKeywords(details: string): Set<string> {
  if (!details) return new Set();
  const normalizedText = details.toLowerCase().replace(/[.,!?;:()"\'\\d]/g, '').replace(/\\s+/g, ' ');
  const words = normalizedText.split(' ');
  // Filter out short words and stop words
  return new Set(words.filter(word => word.length > 1 && !STOP_WORDS.has(word)));
}

// Define a more specific type for node data if needed
export interface PersonaNodeData {
  label: string;
  // Potentially other persona info for display or interaction
}

// Type for the function's return value
export interface RelationshipGraphData {
  nodes: Node<PersonaNodeData>[];
  edges: Edge[];
}

export function calculatePersonaRelationships(
  personas: AIPersona[], // Assuming AIPersona is { id: string, name: string, details: string, ... }
  commonKeywordThreshold: number = 2
): RelationshipGraphData {
  if (!personas || personas.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node<PersonaNodeData>[] = personas.map((persona) => ({
    id: persona.id,
    data: { label: persona.name },
    position: { x: Math.random() * 700 - 100 , y: Math.random() * 500 - 100 }, // Spread out nodes a bit
    type: 'default', // Or a custom node type name
  }));

  const edges: Edge[] = [];
  const personaKeywordsCache: Map<string, Set<string>> = new Map();

  // Pre-calculate keywords for each persona
  for (const persona of personas) {
    personaKeywordsCache.set(persona.id, extractKeywords(persona.details));
  }

  // Determine relationships based on common keywords
  for (let i = 0; i < personas.length; i++) {
    for (let j = i + 1; j < personas.length; j++) {
      const persona1 = personas[i];
      const persona2 = personas[j];

      const keywords1 = personaKeywordsCache.get(persona1.id) || new Set();
      const keywords2 = personaKeywordsCache.get(persona2.id) || new Set();

      const commonKeywords = new Set([...keywords1].filter(keyword => keywords2.has(keyword)));

      if (commonKeywords.size >= commonKeywordThreshold) {
        edges.push({
          id: `e-${persona1.id}-${persona2.id}`, // Shorter edge ID
          source: persona1.id,
          target: persona2.id,
          // type: 'smoothstep', // Example for a different edge type
          // animated: commonKeywords.size > (commonKeywordThreshold + 2), // Animate if very strong connection
          // label: `${commonKeywords.size} links`, // Optional: show strength
        });
      }
    }
  }

  return { nodes, edges };
}

// Example of how AIPersona type might need to be defined locally if not importable
// For now, we assume it will be imported or defined in a shared types file.
/*
export interface AIPersona {
  id: string;
  name: string;
  details: string;
  response: string; // from Step1
  // Add other fields if they exist and are relevant
}
*/ 