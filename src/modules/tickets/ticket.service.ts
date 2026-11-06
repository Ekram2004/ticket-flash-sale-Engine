import { randomUUID } from "node:crypto";
import { TicketRepository, TicketRepositoryError } from "./ticket.repository.js";

export interface TicketResponseDto {
  id: string;
  event_id: string;
  type: "regular" | "VIP" | "VVIP";
}


export class TicketService {
    private ticketRepo = new TicketRepository();

    async create(
        event_id: string,
        type: "regular" | "VIP" | "VVIP"
    ): Promise<string>{
        const ticketId = randomUUID();
        return this.ticketRepo.createTicket(ticketId, event_id, type);
    }

    async fetch(): Promise<TicketResponseDto[]>{
        const rows = await this.ticketRepo.listTicket();
        return rows.map((row: any) => ({
            id: row.id,
            event_id: row.event_id,
            type: row.type
        }));
    }
}