import { db } from "../../db/pool.js";



export class OrderRepositoryError extends Error{
    constructor(
        public statusCode: number,
        message: string,
    ) {
        super(message);
        this.name = "OrderRepositoryError";
    }
}

export interface orderDbRow {
  id: string;
  user_id: string;
  flash_sale_id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED";
  expires_at: Date;
  created_at: Date;
}

export class OrderRepository {
  private readonly CHECK_VIOLATION_CODE = "23514";
  private readonly UNIQUE_VIOLATION_CODE = "23505";
  private readonly FOREIGN_KEY_VIOLATION_CODE = "23503";

  private readonly EXPIRATION_CONSTRAINT = "valid_order_expiration";
  private readonly UNIQUE_ACTIVE_ORDER_INDEX =
    "unique_active_order_per_user_sale";

  async createOrder(
    orderId: string,
    userId: string,
    flashSaleId: string,
    ticketId: string,
    unitPriceMinor: number,
    expires_at: Date,
  ): Promise<string> {
    const client = await db.connect();

    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO orders(id, user_id,flash_sale_id, status,expires_at)VALUES($1, $2, $3,'PENDING', $4)`,
        [orderId, userId, flashSaleId, expires_at],
      );

      await client.query(
        `INSERT INTO order_items(order_id, flash_sale_id, ticket_id,quantity, unit_price) VALUES($1, $2, $3, 1, $4)`,
        [orderId, flashSaleId, ticketId, unitPriceMinor],
      );

      const inventoryUpdate = await client.query(
        `UPDATE flash_sales_tickets SET available_quantity = available_quantity - 1 WHERE flash_sale_id = $1 AND ticket_id = $2 AND available_quantity > 0`,
        [flashSaleId, ticketId],
      );
      if (inventoryUpdate.rowCount === 0) {
        throw new OrderRepositoryError(
          409,
          "Ticket allocation is fully exhausted.",
        );
      }
      await client.query("COMMIT");
      return orderId;
    } catch (error: any) {
      await client.query("ROLLBACK");
      if (error instanceof OrderRepositoryError) {
        throw error;
      }
      switch (error.code) {
        case this.FOREIGN_KEY_VIOLATION_CODE:
          throw new OrderRepositoryError(
            400,
            "Invalid reference identifiers provided (user, flash sale, or ticket does not exist).",
          );

        case this.UNIQUE_VIOLATION_CODE:
          if (error.constraint === this.UNIQUE_ACTIVE_ORDER_INDEX) {
            throw new OrderRepositoryError(
              409,
              "You already possess an active pending or confirmed booking for this sale.",
            );
          }
          throw new OrderRepositoryError(
            409,
            "An order transaction conflict occurred.",
          );

        case this.CHECK_VIOLATION_CODE:
          if (error.constraint === this.EXPIRATION_CONSTRAINT) {
            throw new OrderRepositoryError(
              400,
              "Invalid timestamp constraints: Order expiration must be set in the future.",
            );
          }
          break;
      }

      throw new OrderRepositoryError(
        500,
        "Internal system database failure during checkout transaction processing.",
      );
    } finally {
      client.release();
    }
  }

  async listOrders(): Promise<orderDbRow[]> {
    const client = await db.connect();
    try {
      const result = await client.query<orderDbRow>(
        `SELECT id, user_id, flash_sale_id, status, expires_at, created_at FROM orders ORDER BY created_at DESC`,
      );
      return result.rows;
    } catch (error) {
      throw new OrderRepositoryError(
        500,
        "Internal database error occurred while fetching order history.",
      );
    } finally {
      client.release();
    }
  }
}
