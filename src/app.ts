import Fastify from 'fastify';
import dotenv from 'dotenv';
import { bookTicket } from './controllers/ticketController.js';



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


    app.post('/api/buy', async (request, reply) => {
        
        const body = request.body as {
          userId: string;
          flashSaleId: string;
          ticketId: string;
        }; 
        try {
          const result = await bookTicket(body);
            return reply.status(201).send({
                success: true,
                ...result
          })
        } catch (error: any) {
          return reply.status(400).send({
            success: false,
            message: error.message || "Booking failed",
          });
        }

        

    })



    return app;
}