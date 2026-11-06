import { type FastifyInstance } from "fastify";
import { OrderController } from "./order.controller.js";
import { createOrderSchema, listOrdersSchema, type OrderInput } from "./order.schema.js";
import { authenticateSession } from "../../plugins/authentication.js";
import { requireAdmin } from "../../plugins/hooks/rbac.hook.js";


export async function orderRoutes(fastify: FastifyInstance) {
    const orderController = new OrderController();

    fastify.post<{ Body: OrderInput }>(
        "/orders", { preHandler:[authenticateSession], schema: createOrderSchema },
        orderController.createOrderHandler
    );

    fastify.get("/admin/orders", { preHandler: [authenticateSession, requireAdmin], schema: listOrdersSchema }, orderController.fetchOrderHandler);
}