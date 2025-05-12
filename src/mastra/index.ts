import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { LibSQLStore } from '@mastra/libsql';

import { weatherAgent } from './agents';
import { testAgent } from './agents/testAgent';
import { estimatorAgent } from './agents/estimatorAgent';
import { personaFactory } from './tools/personaFactory';
import { orchestratorAgent } from './agents/orchestratorAgent';
import { handleGenerateExpertProposal } from './routes/generateExpertProposal';

export const mastra = new Mastra({
  agents: { weatherAgent, testAgent, estimatorAgent, orchestratorAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
  tools: {
    personaFactory,
  },
  server: {
    port: 4111,
    host: '0.0.0.0',
    apiRoutes: [
      {
        path: '/generate-expert-proposal',
        method: 'POST',
        handler: handleGenerateExpertProposal,
      },
    ],
  },
});
