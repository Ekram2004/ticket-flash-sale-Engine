import { type FastifyInstance } from "fastify";
import { FlashSaleController } from "./flash_sale_controller.js";
import { createFlashSaleSchema, listFlashSaleSchema, type FlashSaleInput } from "./flash_sale.schema.js";
import { authenticateSession } from "../../plugins/authentication.js";
import { requireAdmin } from "../../plugins/hooks/rbac.hook.js";



export async function flashSaleRoutes(fastify: FastifyInstance) {
    const flashSaleController = new FlashSaleController();

    fastify.post<{ Body: FlashSaleInput }>(
        "/flash_sales", { preHandler: [authenticateSession, requireAdmin], schema: createFlashSaleSchema },
        flashSaleController.createFlashSaleHandler
    );

    fastify.get("/flash-sales", { preHandler: [authenticateSession], schema: listFlashSaleSchema }, flashSaleController.fetchFlashSaleHandler);
}