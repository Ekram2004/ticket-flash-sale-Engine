import { randomUUID } from "node:crypto";
import { EventRepository, EventRepositoryError } from "./event.repository.js";
import { title } from "node:process";

export interface EventResponseDto {
  id: string;
  title: string;
  location: string;
  event_date: string; 
  description: string | null;
  created_at: string;
  updated_at: string;
}


export class EventService {
  private eventRepo = new EventRepository();

  async create(
    title: string,
    location: string,
    event_date: string,
    description?: string,
  ): Promise<string> {
    const eventId = randomUUID();
    return this.eventRepo.createEvent(
      eventId,
      title,
      location,
      event_date,
      description,
    );
  }

    async fetch(): Promise<EventRepository[]> {
        const rows = await this.eventRepo.listEvent();
        return rows.map((row:any) => ({
            id: row.id,
            title: row.title,
            location: row.location,
            event_date: row.event_date instanceof Date ? row.event_date.toISOString() : row.event_date,
      description: row.description,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
 
    }))
  }
}