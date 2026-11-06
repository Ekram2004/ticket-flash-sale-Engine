import { type FastifyInstance } from "fastify";
import { TicketController } from "./ticket.controller.js";
import { createTicketSchema, listTicketSchema, type TicketInput } from "./ticket.schema.js";
import { authenticateSession } from "../../plugins/authentication.js";
import { requireAdmin } from "../../plugins/hooks/rbac.hook.js";



export async function ticketRoutes(fastify: FastifyInstance) {
    const ticketController = new TicketController();

    fastify.post<{ Body: TicketInput }>(
        "/tickets", { preHandler: [authenticateSession, requireAdmin], schema: createTicketSchema },
        ticketController.createTicketHandler
    );

    fastify.get("/tickets", { preHandler: [authenticateSession], schema: listTicketSchema }, ticketController.fetchTicketHandler);
}