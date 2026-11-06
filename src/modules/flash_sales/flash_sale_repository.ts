import { db } from "../../db/pool.js";

export class FlashSaleRepositoryError extends Error{
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "FlashSaleRepositoryError";
    }
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
}