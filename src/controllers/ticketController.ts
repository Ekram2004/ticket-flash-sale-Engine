import { db } from "../db/index.js";
import { v7 as uuidv7 } from "uuid";


interface bookingInput {
  flashSaleId: string;
  ticketId: string;
  userId: string;
}


export async function bookTicket(input: bookingInput){
    const { flashSaleId, ticketId, userId } = input;

    const client = await db.connect();
  try {

    await client.query('BEGIN');
    const result = await client.query(
      `
        UPDATE flash_sales_tickets SET stock = stock - 1 WHERE flash_sale_id = $1 AND ticket_id = $2 AND stock > 0 RETURNING stock, price`,
      [flashSaleId, ticketId],
    );
    
    if (result.rowCount !== 1) {
      const current_stock = await client.query(
        `SELECT stock FROM flash_sales_tickets WHERE flash_sale_id = $1 AND ticket_id = $2 `,
        [flashSaleId, ticketId],
      );
      if (current_stock.rowCount === 0) {
        throw new Error("Ticket inventory not found");
      } else {
        throw new Error('Sold out');
      }

    }

    const remainingStock = result.rows[0].stock;
    const unitPrice = result.rows[0].price;
    const orderId = uuidv7();

        await client.query(
          `INSERT INTO orders (id, user_id, flash_sale_id, status) VALUES($1, $2, $3, $4)`,
          [orderId, userId, flashSaleId, "PENDING"],
        );
    
    await client.query(
      `INSERT INTO order_items (order_id,flash_sale_id, ticket_id, quantity, unit_price) VALUES($1, $2, $3, $4, $5)`,[orderId, flashSaleId, ticketId, 1, unitPrice]
    );
        
    await client.query('COMMIT');
        return {
          remainingStock: remainingStock,
          message: "Order created",
        };
  } catch (error) {
    await client.query('ROLLBACK');
        throw error
    } finally {
        client.release();
    }
}