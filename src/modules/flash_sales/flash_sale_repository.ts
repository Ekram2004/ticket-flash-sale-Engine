import { db } from "../../db/pool.js";

export class FlashSaleRepositoryError extends Error{
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "FlashSaleRepositoryError";
    }
}

export interface flashDbRow {
  id: string;
  event_id: string;
  title: string;
  start_time: Date;
    end_time: Date;
    status: string | null;
    created_at: Date;
}


export class FlashSaleRepository{

    async createRepository(
        flashSaleId: string,
        eventId: string,
        title: string,
        startTime: string,
        endTime: string,
        status?: string
    ): Promise<string>{
        const targetStatus = status || "scheduled";

        const client = await db.connect();

        try {
            await client.query(
              `INSERT INTO flash_sales (id,event_id, title, start_time, end_time, status)VALUES($1, $2, $3, $4, $5, $6)`,
              [flashSaleId, eventId, title, startTime, endTime, targetStatus],
            );
            return flashSaleId;
        }
        catch (error:any) {
            if (error.code === "23503") {
              throw new FlashSaleRepositoryError(
                400,
                "Failed to create flash sale: The provided eventId does not exist.",
              );
            }

            throw new FlashSaleRepositoryError(
                500,
                "Internal server error during Flash sale creation",
            );
        } finally {
            client.release();
                }
    }

    async listFlashSale(): Promise<flashDbRow[]>{
        const client = await db.connect();
        try {
            const result = await client.query<flashDbRow>(
              `SELECT id, event_id, title, start_time, end_time, status, created_at FROM flash_sales ORDER BY start_time ASC`,
            );
            return result.rows;
        } catch (error) {
            throw new FlashSaleRepositoryError(500, "Internal server error during flash-sale fetching!");
        } finally {
            client.release();
        }
    }
}