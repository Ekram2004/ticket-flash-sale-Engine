import { randomUUID } from "node:crypto";
import { db } from "../../db/pool.js";


export class BookingRepository{
    async createBookingWithAtomicStock(
        flashSaleId: string,
        ticketId: string,
        userId: string,
    ): Promise<string>{
        const client = await db.connect();
        let destroyClient = false

        try {
            await client.query('BEGIN');

            const stockResult = await client.query(
              `
            UPDATE flash_sales_tickets
            SET available_quantity = available_quantity - 1
            WHERE flash_sale_id = $1 AND ticket_id = $2 AND available_quantity > 0 AND EXISTS(SELECT 1 FROM flash_sales fs WHERE fs.id = $1 AND fs.status = 'active' AND NOW() >= fs.start_time AND NOW() < fs.end_time) RETURNING price_minor`,
              [flashSaleId, ticketId],
            );


            if (stockResult.rowCount !== 1) {
                throw new Error('INSUFFICIENT_STOCK');
            }

            const unitPrice = stockResult.rows[0].price_minor
            const orderId = randomUUID()

            await client.query(`INSERT INTO orders(id, user_id, flash_sale_id, status, expires_at) VALUES ($1, $2, $3, 'PENDING', NOW() + INTERVAL '10 minutes' );`, [orderId, userId, flashSaleId]);
            
            await client.query(
              `INSERT INTO order_items(order_id,flash_sale_id,ticket_id, quantity, unit_price) VALUES ($1, $2, $3, 1, $4)`,[orderId, flashSaleId, ticketId, unitPrice]
            );

            await client.query('COMMIT');
            return orderId
        } catch (error) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackError) {
                destroyClient = true;
                console.error("Transaction rollback failed:", rollbackError);
            }
            throw error;
        } finally {
            if (destroyClient) {
                        client.release(
                          new Error(
                            "Discard connection because rollback failed.",
                          ),
                        );

            }
            else {
                client.release();
            }
        }
    }
}