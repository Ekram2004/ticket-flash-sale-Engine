import { type FastifyRequest, type FastifyReply } from "fastify";
import { EventService } from "./events.service.js";
import { type EventInput } from "./event.schema.js";


export class EventController{
    private eventService: EventService;

    constructor() {
        this.eventService = new EventService();
    }

    createEventHandler = async (request: FastifyRequest<{ Body: EventInput }>, reply: FastifyReply) => {
        const { title, location, event_date, description } = request.body;
        const eventId = await this.eventService.create(title, location, event_date, description);
        return reply.status(201).send({
            success: true,
            eventId,
            message: "Event successfully created!"
        });
    }

    fetchEventHandler = async (request: FastifyRequest, reply: FastifyReply) => {
        const rawData = await this.eventService.fetch();

        const detail = Array.isArray(rawData) ? rawData : [];
        return reply.status(200).send({
            success: true,
            detail: detail,
            message: "Events successfully fetched!"
        });
    }
}