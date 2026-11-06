import { type FastifyRequest, type FastifyReply } from "fastify";
import { type OrderInput } from "./order.schema.js";
import { OrderService } from "./order.service.js";
import { OrderRepositoryError } from "./order.repository.js";


export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  createOrderHandler = async (
    request: FastifyRequest<{ Body: OrderInput }>,
    reply: FastifyReply,
  ) => {
    try {
      const sessionUser = (request as any).session?.get("user") || (request as any).user;
      const userId = sessionUser.id
      const { flash_sale_id, ticket_id } = request.body;
      const orderId = await this.orderService.createOrder(
        userId,
        flash_sale_id,
        ticket_id
      );

      return reply.status(201).send({
        success: true,
        orderId,
        message: "Order successfully created!",
      });

    } catch (error: any) {
      if (error instanceof OrderRepositoryError) {
        return reply.status(error.statusCode).send({
          error: error.statusCode === 409 ? "Conflict" : "Bad Request",
          message: error.message,
        });
      }
      throw error;
    }
  };

  fetchOrderHandler = async (
    _request: FastifyRequest,
    reply: FastifyReply,
  ) => {
    try {
      const orders = await this.orderService.fetch();

    
      return reply.status(200).send({
        success: true,
        message: "Orders successfully fetched!",
        orders: orders,
      });
    } catch (error) {
      return reply.status(500).send({
        error: "Internal Server Error",
        message: "An unexpected database exception occured while extracting order history."
      });
    }
    
  };
}