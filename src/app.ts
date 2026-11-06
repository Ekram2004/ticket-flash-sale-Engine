import Fastify from 'fastify';
import { bookTicket } from './controllers/ticketController.js';
import { bookingRoutes } from './modules/bookings/booking.routes.js';
import { registerUserRoutes } from './modules/auth/auth.routes.js';
import { loginUserRoutes } from './modules/auth/auth.routes.js';
import cookie from '@fastify/cookie';
import secureSession from "@fastify/secure-session";
import fastifyCookie from '@fastify/cookie';
import { UserRepositoryError } from './modules/auth/auth.repository.js';
import { eventRoutes } from './modules/events/event.routes.js';
import { flashSaleRoutes } from './modules/flash_sales/flash_sale_routes.js';
import { ticketRoutes } from './modules/tickets/ticket.router.js';
import { orderRoutes } from './modules/orders/order.routes.js';





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
  
  app.register(fastifyCookie);

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof UserRepositoryError) {
      return reply.code(error.statusCode).send({
        error: error.statusCode === 409 ? "Conflict" : "Unauthorized",
        message: error.message
      });
    }

    if (error instanceof Error && 'validation' in error && error.validation) {
      return reply.code(400).send({
        error: "Bad Request",
        message: error.message
      });
    }
    request.log.error(error);
    return reply.code(500).send({
      error: "Internal Server Error",
      message: "An unexpected error occured."
    });
  });


  app.register(bookingRoutes, { prefix: "/api" });
  app.register(registerUserRoutes, { prefix: "/api/v1/auth" });
  app.register(loginUserRoutes, { prefix: "/api/v1/auth" })
  app.register(eventRoutes, { prefix: "/api/v1/admin" });
  app.register(eventRoutes, { prefix: "/api/v1" });
  app.register(flashSaleRoutes, { prefix: "/api/v1/admin" });
  app.register(flashSaleRoutes, { prefix: "/api/v1" });
  app.register(ticketRoutes, { prefix: "/api/v1/admin" });
  app.register(orderRoutes, { prefix: "/api/v1" });

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