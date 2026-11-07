import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../../db/pool.js";


export class BookingRepositoryError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "BookingRepositoryError";
  }
}

export interface bookingDbRow {
  id: string;
  order_id: string;
  user_id: string;
  flash_sale_id: string;
  status: "CONFIRMED" | "CANCELLED" | "REFUNDED";
  created_at: Date;
}



export class BookingRepository {
  async settleTransaction(
    bookingId: string,
    issuedTicketId: string,
    orderId: string,
    userId: string,
    flashSaleId: string,
    ticketId: string,
  ): Promise<string> {
    const client = await db.connect();
    let shouldDiscardClient = false;

    try {
      await client.query("BEGIN");

      const orderUpdate = await client.query(
        `UPDATE orders 
         SET status = 'CONFIRMED' 
         WHERE id = $1 AND status = 'PENDING' AND expires_at > NOW()
         RETURNING id`,
        [orderId],
      );

      if (orderUpdate.rowCount === 0) {
        throw new BookingRepositoryError(
          410,
          "Fulfillment failed: The temporary reservation lock has expired or is already settled.",
        );
      }

      await client.query(
        `INSERT INTO bookings (id, order_id, user_id, flash_sale_id, status)
         VALUES ($1, $2, $3, $4, 'CONFIRMED')`,
        [bookingId, orderId, userId, flashSaleId],
      );

      const secureHashToken = randomBytes(32).toString("hex");

      await client.query(
        `INSERT INTO issued_tickets (id, booking_id, flash_sale_id, ticket_id, secure_hash_token)
         VALUES ($1, $2, $3, $4, $5)`,
        [issuedTicketId, bookingId, flashSaleId, ticketId, secureHashToken],
      );

      await client.query("COMMIT");
      return bookingId;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        shouldDiscardClient = true;
        console.error("Transaction rollback failed:", rollbackError);
      }
      if (error instanceof BookingRepositoryError) {
        throw error;
      }
      throw new BookingRepositoryError(
        500,
        "Internal database failure during booking fulfillment processing.",
      );
    } finally {
      if (shouldDiscardClient) {
        client.release(
          new Error("Discard connection because rollback failed."),
        );
      } else {
        client.release();
      }
    }
  }

  async getBookingsByUser(userId: string): Promise<bookingDbRow[]> {
    const client = await db.connect();
    try {
      const result = await client.query<bookingDbRow>(
        `SELECT id, order_id, user_id, flash_sale_id, status, created_at 
         FROM bookings 
         WHERE user_id = $1 
         ORDER BY created_at DESC`,
        [userId],
      );
      return result.rows;
    } catch (error) {
      throw new BookingRepositoryError(
        500,
        "Failed to retrieve customer booking history from database.",
      );
    } finally {
      client.release();
    }
  }
}
