import { type FastifySchema } from "fastify";


export interface OrderInput {
  user_id: string;
  flash_sale_id: string;
  ticket_id: string;
}

const errorResponseSchema = {
  type: "object",
  required: ["error", "message"],
  additionalProperties: false,
  properties: {
    error: { type: "string" },
    message: { type: "string" },
  },
};

export const createOrderSchema = {
  body: {
    type: "object",
    required: ["flash_sale_id", "ticket_id"],
    additionalProperties: false,
    properties: {
      flash_sale_id: { type: "string", format: "uuid" },
      ticket_id: { type: "string", format: "uuid" },
    },
  },
  response: {
    201: {
      type: "object",
      required: ["success", "orderId", "message"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        orderId: { type: "string", format: "uuid" },
        message: { type: "string" },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    409: errorResponseSchema,
    500: errorResponseSchema,
  },
};


export const listOrdersSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      required: ["success", "message", "orders"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        orders: {
          type: "array",
          items: {
            type: "object",
            required: [
              "id",
              "flash_sale_id",
              "status",
              "expires_at",
              "created_at",
            ],
            additionalProperties: false,
            properties: {
              id: { type: "string", format: "uuid" },
              flash_sale_id: { type: "string", format: "uuid" },
              status: {
                type: "string",
                enum: ["PENDING", "CONFIRMED", "CANCELLED", "EXPIRED"],
              },
              expires_at: { type: "string", format: "date-time" },
              created_at: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    500: errorResponseSchema,
  },
};