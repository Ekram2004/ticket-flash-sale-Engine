import { type FastifyRequest, type FastifyReply } from "fastify";
import { TicketService } from "./ticket.service.js";
import { type TicketInput } from "./ticket.schema.js";
import { request } from "http";


export class TicketController{
    private ticketService: TicketService;

    constructor() {
        this.ticketService = new TicketService();
    }

    createTicketHandler = async (request: FastifyRequest<{ Body: TicketInput }>, reply: FastifyReply) => {
        const { event_id, type } = request.body;
        const ticketId = await this.ticketService.create(event_id, type);
        return reply.status(201).send({
            success: true,
            ticketId,
            message: "Ticket successfully created!"
        });
    }

    fetchTicketHandler = async (request: FastifyRequest, reply: FastifyReply) => {
        const rawData = await this.ticketService.fetch();

        const detail = Array.isArray(rawData) ? rawData : [];
        return reply.status(200).send({
            success: true,
            message: "Ticket successfully fetched!",
            detail: detail
        })
    }
}