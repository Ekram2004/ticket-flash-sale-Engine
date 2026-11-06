import { randomUUID } from "node:crypto";
import { FlashSaleRepository, FlashSaleRepositoryError } from "./flash_sale_repository.js";

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
}