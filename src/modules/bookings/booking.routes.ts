import { type FastifyInstance } from "fastify";
import { BookingController } from "./booking.controller.js";
import { bookTicketSchema } from "./booking.schema.js";


export async function bookingRoutes(fastify: FastifyInstance) {
    const controller = new BookingController();

    fastify.post(
      "/bookings",
      { schema: bookTicketSchema },
      controller.bookTicketHandler.bind(controller),
    );
}
