import { randomUUID } from "node:crypto";
import { FlashSaleRepository, FlashSaleRepositoryError } from "./flash_sale_repository.js";
import { title } from "node:process";

export interface FlashSaleResponseDto {
    id: string;
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at: string;
}

export class FlashSaleService {
    private flashSaleRepo = new FlashSaleRepository();

    async create(
        event_id: string,
        title: string,
        startTime: string,
        endTime: string,
        status?:string
    ): Promise<string>{
        const flashSaleId = randomUUID();
        return this.flashSaleRepo.createRepository(flashSaleId,
            event_id,
            title,
            startTime,
            endTime,
            status
        );
    }

    async fetch(): Promise<FlashSaleResponseDto[]>{
        const rows = await this.flashSaleRepo.listFlashSale();
        return rows.map((row: any) => ({
            id: row.id,
            event_id: row.event_id,
            title: row.title,
            start_time: row.start_time instanceof Date ? row.start_time.toISOString(): row.start_time,
            end_time: row.end_time instanceof Date? row.end_time.toISOString(): row.end_time,
            status: row.status,
            created_at: row.created_at.toISOString(),
        }))
    }
}