import { db } from "../../db/pool.js";


export class EventRepositoryError extends Error{
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "EventRepositoryError";
    }
}

export interface EventDbRow {
    id: string;
    title: string;
    location: string;
    even_date: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
}

export class EventRepository{

    async createEvent(
        eventId: string,
        title: string,
        location: string,
        eventDate: string,
        description?: string
    ): Promise<string>{
        const client = await db.connect();
        try {
            await client.query(`INSERT INTO events (id, title, location, event_date, description) VALUES($1, $2, $3, $4, $5)`, [eventId, title, location, eventDate, description ?? null]);
            return eventId;
        } catch (error) {
            throw new EventRepositoryError(
              500,
              "Internal server error during event creation",
            );
        }
        finally {
            client.release();
        }
    }
}