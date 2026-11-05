import { randomUUID } from "node:crypto";
import { EventRepository, EventRepositoryError } from "./event.repository.js";


export class EventService{
    private eventRepo = new EventRepository();

    async create(
        title: string,
        location: string,
        event_date: string,
        description?: string
    ): Promise<string>{
        const eventId = randomUUID();
        return this.eventRepo.createEvent(eventId, title, location, event_date, description);
    }
}