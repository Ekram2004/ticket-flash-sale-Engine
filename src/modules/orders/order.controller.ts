import { type FastifyRequest, type FastifyReply } from "fastify";
import { type OrderInput } from "./order.schema.js";
import { OrderService } from "./order.service.js";
import { OrderRepositoryError } from "./order.repository.js";
import { IdempotencyService } from "../idempotency/idempotency.service.js";



export class OrderController {
  private orderService: OrderService;
  private idempotencyService: IdempotencyService;

  constructor() {
    this.orderService = new OrderService();
    this.idempotencyService = new IdempotencyService();
  }

  createOrderHandler = async (
    request: FastifyRequest<{ Body: OrderInput }>,
    reply: FastifyReply,
  ) => {
      const sessionUser =
        (request as any).session?.get("user") || (request as any).user;
      const userId = sessionUser.id;

    const idempotencyKey = request.headers["idempotency-key"] as string;
    const { flash_sale_id, ticket_id } = request.body;

    if (!idempotencyKey) {
      try {
        const orderId = await this.orderService.createOrder(userId, (request.body as any).flash_sale_id, (request.body as any).ticket_id);
        return reply.status(201).send({ success: true, orderId });
      }
      catch (error: any) {
        return this.handleError(error, reply);
      }
      }
    const intercept = await this.idempotencyService.handleIdempotentExecution(idempotencyKey, userId, request.body);
    
    if (intercept.action === "RESPOND_CACHED") {
      return reply.status(intercept.code!).send(intercept.body);
    }
      if (intercept.action === "RETRY_LATER") {
        return reply.status(423).send({
          error: "Locked",
          message: "An identical ticket processing request is actively execute. Please wait."
        });
      }
      try {
      const orderId = await this.orderService.createOrder(
        userId,
        flash_sale_id,
        ticket_id,
        );
        const successResponse = {
          success: true,
          orderId,
          message: "Order successfully created!",
        };
        await this.idempotencyService.finalize(
          idempotencyKey,
          "COMPLETED",
          201,
          successResponse,
        );
        return reply.status(201).send(successResponse);
    } catch (error: any) {
        if (error instanceof OrderRepositoryError) {
        const errCode = error.statusCode;
        const errorResponse = {
          error: errCode === 409 ? "Conflict" : "Bad Request",
          message: error.message,
        };
await this.idempotencyService.finalize(
  idempotencyKey,
  "COMPLETED",
  errCode,
  errorResponse,
);
return reply.status(errCode).send(errorResponse);
      }
      await this.idempotencyService.abortLock(idempotencyKey);
      throw error;

    }
  };

  fetchOrderHandler = async (_request: FastifyRequest, reply: FastifyReply) => {
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
        message:
          "An unexpected database exception occured while extracting order history.",
      });
    }
  };

  private handleError(error: any, reply: FastifyReply) {
    if (error instanceof OrderRepositoryError) {
      return reply.status(error.statusCode).send({
        error: error.statusCode === 409 ? "Conflict" : "Bad Request",
        message: error.message
      });
    }
    throw error;
  }
}