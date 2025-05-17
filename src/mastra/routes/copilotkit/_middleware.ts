import { cors } from 'hono/cors';
import { createFactory } from 'hono/factory';

const factory = createFactory();

// onRequestとしてexportすることで、Mastraのファイルベースルーティングミドルウェアとして機能する想定
export const onRequest = factory.createHandlers(
  cors({
    origin: '*', // 本番環境ではより厳密なオリジンを指定してください
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-CopilotKit-Framework', 'X-CopilotKit-Version'], // CopilotKitが必要とする可能性のあるヘッダー
  })
); 