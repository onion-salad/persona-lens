import dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' }); // ルートの .env.local を参照

import { Mastra } from '@mastra/core';
import { personaCreatorAgent } from "./agents/persona-creator";
import { personaGenerationWorkflow } from "./workflows/persona-workflow";

export const mastra = new Mastra({
  agents: { personaCreatorAgent },
  workflows: { personaGenerationWorkflow },
});
        