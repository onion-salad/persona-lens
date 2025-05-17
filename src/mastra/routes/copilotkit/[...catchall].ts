import { CopilotRuntime } from '@copilotkit/runtime';
import { MastraClient } from '@mastra/client-js';
import type { Context } from 'hono';
import { createFactory } from 'hono/factory';

const factory = createFactory();

let copilotRuntimeInstance: CopilotRuntime | null = null;
let runtimeInitializationPromise: Promise<void> | null = null;

async function initializeCopilotRuntimeOnce(): Promise<void> {
    if (copilotRuntimeInstance) return;
    if (runtimeInitializationPromise) return runtimeInitializationPromise;

    runtimeInitializationPromise = (async () => {
        try {
            console.log("Initializing CopilotRuntime...");
            const mastraClient = new MastraClient({ baseUrl: "http://localhost:4111" });
            let mastraAgentsDefinitions: Record<string, any> = {}; // 型をより具体的にする必要があるかも
            
            try {
                console.log("Fetching AGUI from Mastra...");
                // const aguiResult = await mastraClient.getAGUI(); 
                
                // if (typeof aguiResult === 'object' && aguiResult !== null) {
                //     mastraAgentsDefinitions = aguiResult as Record<string, any>; 
                //     console.log("Successfully fetched AGUI from Mastra. Definitions:", mastraAgentsDefinitions);
                // } else {
                //     console.warn(`Mastra AGUI did not return an object. Type: ${typeof aguiResult}. Using empty agent definitions.`);
                // }
                console.warn("mastraClient.getAGUI() call is temporarily commented out due to potential issues.");
            } catch (error) {
                 console.error("Failed to fetch AGUI from Mastra. Using empty agent definitions.", error);
            }

            copilotRuntimeInstance = new CopilotRuntime({
                agents: mastraAgentsDefinitions, 
             });
            console.log("CopilotRuntime instance initialized successfully.");
        } catch (error) {
            console.error("Failed to initialize CopilotRuntime:", error);
            copilotRuntimeInstance = new CopilotRuntime({}); 
        } finally {
            runtimeInitializationPromise = null;
        }
    })();
    return runtimeInitializationPromise;
}

initializeCopilotRuntimeOnce();

export const all = factory.createHandlers(async (c: Context) => {
  await initializeCopilotRuntimeOnce(); 

  if (!copilotRuntimeInstance) {
    console.error("CopilotRuntime instance is not available.");
    return c.json({ error: "CopilotRuntime not initialized or initialization failed" }, 503);
  }

  const method = c.req.method;
  const url = c.req.url;
  console.log(`CopilotKit Endpoint received request: ${method} ${url}`);

  let requestBody = null;
  if (method === 'POST' || method === 'PUT') {
    try {
      if (c.req.header('content-type')?.includes('application/json')) {
          requestBody = await c.req.json();
          console.log("Request Body (JSON):", JSON.stringify(requestBody, null, 2));
      }
    } catch (e) {
        console.warn("Could not parse JSON body for CopilotKit request", e);
    }
  }
  console.log("Request header logging temporarily commented out.");

  return c.text(
    `CopilotKit Hono Endpoint Placeholder.\nReceived: ${method} ${url}\nRuntime initialized: ${!!copilotRuntimeInstance}\nThis endpoint needs full implementation to proxy requests to CopilotRuntime.`,
    501 
  );
}); 