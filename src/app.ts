import Fastify from 'fastify';
import dotenv from 'dotenv';



dotenv.config();

export function buildApp() {
    const app = Fastify({
      logger: {
        level: "info",
        ...(process.env.NODE_ENV === "development"
          ? { transport: { target: "pino-pretty" } }
          : {}),
      },
      genReqId: (req) =>req.headers["x-request-id"] as string || crypto.randomUUID(),
    });

    app.get('/health', async () => {
        return {
            status: 'healthy', timeStamp: new Date().toISOString()
        };
    });

    return app;
}