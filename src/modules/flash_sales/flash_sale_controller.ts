import { type FastifyRequest, type FastifyReply } from "fastify";
import { FlashSaleService } from "./flash_sale_service.js";
import { type FlashSaleInput } from "./flash_sale.schema.js";


export class FlashSaleController{
    private flashSaleService: FlashSaleService;

    constructor() {
        this.flashSaleService = new FlashSaleService();
    }

    createFlashSaleHandler = async (request: FastifyRequest<{ Body: FlashSaleInput }>, reply: FastifyReply) => {
        const { event_id, title, start_time, end_time, status } = request.body;
        const flashSaleId = await this.flashSaleService.create(
          event_id,
          title,
          start_time,
          end_time,
          status,
        );
        return reply.status(201).send({
          success: true,
          flashSaleId,
          message: "Flash sale successfully created!",
        }); 
  }
  
  fetchFlashSaleHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const rawData = await this.flashSaleService.fetch();

    const detail = Array.isArray(rawData) ? rawData : [];
    return reply.status(200).send({
      success: true,
      message: "Flash sales successfully fetched!",
      detail: detail,
    })
  }
}