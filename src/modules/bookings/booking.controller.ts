import { type FastifyRequest, type FastifyReply } from "fastify";
import { BookingService } from "./booking.service.js";
import { type BookTicketInput } from "./booking.schema.js";


export class BookingController {
    private bookingService: BookingService;
    constructor() {
        this.bookingService = new BookingService();
    }

    async bookTicketHandler(
        request: FastifyRequest<{ Body: BookTicketInput }>,
        reply:FastifyReply
    ) {
        try {
            const userId = (request as any).user?.id;
            if (!userId) {
              return reply.status(401).send({
                error: "UNAUTHORIZED",
                message: "Authentication is required.",
              });
            }

            const rawIdempotencyKey = request.headers["idempotency-key"];
                        if (typeof rawIdempotencyKey !== "string") {
                          return reply.status(400).send({
                            error: "BAD_REQUEST",
                            message:
                              "The required idempotency-key header must be a single string format.",
                          });
                        }



            const orderId = await this.bookingService.processTicketBooking(
              request.body,
              userId,
              rawIdempotencyKey,
            );
            return reply.status(201).send({
                success: true,
                orderId,
                message: "Ticket successfully booked!"
            });
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'Ticket inventory not found or sold out') {
                return reply.status(409).send({
                  error: "CONFLICT",
                  message: error.message,
                });

            }
            return reply.status(500).send({
                error: "INTERNAL_SERVER_ERROR",
                message: "An unexpected processing error occurred",
            });

        }
    }
}
