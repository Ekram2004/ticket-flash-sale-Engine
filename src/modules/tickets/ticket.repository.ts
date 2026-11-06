import { db } from "../../db/pool.js";



export class TicketRepositoryError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "TicketRepositoryError";
  }
}

export interface ticketDbRow {
  id: string;
  event_id: string;
  type: "regular" | "VIP" | "VVIP";
}

export class TicketRepository {
  private readonly UNIQUE_TYPE_CONSTRAINT = "unique_ticket_type_per_event";
  private readonly UNIQUE_EVENT_CONSTRAINT = "unique_event_ticket";

  async createTicket(
    ticketId: string,
    eventId: string,
    type: "regular" | "VIP" | "VVIP",
  ): Promise<string> {
    const client = await db.connect();

    try {
      await client.query(
        `INSERT INTO tickets(id, event_id, type) VALUES($1, $2, $3)`,
        [ticketId, eventId, type],
      );
      return ticketId;
    } catch (error: any) {
      if (error.code === "23503") {
        throw new TicketRepositoryError(
          400,
          "Failed to create Ticket: The provided eventId does not exist.",
        );
      }

      if (
        error.code === "23505" &&
        error.constraint === this.UNIQUE_TYPE_CONSTRAINT
      ) {
        throw new TicketRepositoryError(
          409,
          `Failed to create Ticket: A '${type}' ticket tier already exists for this event.`,
        );
        }
        if (
          error.code === "23505" &&
          error.constraint === this.UNIQUE_EVENT_CONSTRAINT
        ) {
            throw new TicketRepositoryError(
              409,
              `Failed to create Ticket: A '${ticketId}' ticket tier already exists for this event.`,
            );
        }
          throw new TicketRepositoryError(
            500,
            "Internal server error during Flash sale creation",
          );
    } finally {
      client.release();
    }
  }

  async listTicket(): Promise<ticketDbRow[]> {
    const client = await db.connect();
    try {
      const result = await client.query<ticketDbRow>(
        `SELECT id, event_id, type FROM tickets`,
      );
      return result.rows;
    } catch (error) {
      throw new TicketRepositoryError(
        500,
        "Internal server error during ticket fetching!",
      );
    } finally {
      client.release();
    }
  }
}
