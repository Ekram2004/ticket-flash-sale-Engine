import { db } from "../db/index.js";
import { randomUUID } from "node:crypto";


interface bookingInput {
  flashSaleId: string;
  ticketId: string;
  userId: string;
}


export async function bookTicket(input: bookingInput){
    const { flashSaleId, ticketId, userId } = input;

    const client = await db.connect();
    try {
        const current_stock = await client.query(
          `SELECT stock FROM flash_sales_tickets WHERE flash_sale_id = $1 AND ticket_id = $2`,
          [flashSaleId, ticketId],
        );

        if (current_stock.rowCount === 0) {
            throw new Error("Ticket inventory not found");
        }

        if (current_stock.rows[0].stock > 0) {
            const orderId = randomUUID();
            const order = await client.query(
              `INSERT INTO orders (id, user_id, flash_sale_id, status) VALUES($1, $2, $3, $4)`,
              [orderId, userId, flashSaleId, "PENDING"],
            );
        } else {
            throw new Error("Sold out")
        }

        const remainingStock = await client.query(
          `
        UPDATE flash_sales_tickets SET stock = stock - 1 WHERE flash_sale_id = $1 AND ticket_id = $2`,
          [flashSaleId, ticketId],
        );
    
        return {
          remainingStock: remainingStock,
          message: "Order created",
        };
    } catch (error) {
        throw error
    } finally {
        client.release();
    }
}