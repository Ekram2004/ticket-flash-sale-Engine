import { type FastifySchema } from "fastify";


export interface BookTicketInput {
  flashSaleId: string;
  ticketId: string;
}


export const bookTicketSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["flashSaleId", "ticketId"],
    additionalProperties: false,
    properties: {
      flashSaleId: { type: "string", format: "uuid" },
      ticketId: { type: "string", format: "uuid" },
    },
  },
  headers: {
    type: "object",
    required: ["idempotency-key"],
    additionalProperties: true,
    properties: {
      "idempotency-key": {
        type: "string",
        minLength: 1,
        maxLength: 255,
      },
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
    400: {
      type: "object",
      required: ["error", "message"],
      additionalProperties: false,
      properties: {
        error: { type: "string" },
        message: { type: "string" },
      },
    },
  },
};