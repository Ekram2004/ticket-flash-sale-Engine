import { type FastifySchema } from "fastify";


export interface TicketInput {
  event_id: string;
  type: "regular" | "VIP" | "VVIP";
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


export const createTicketSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["event_id", "type"],
    additionalProperties: false,
    properties: {
      event_id: { type: "string", format: "uuid" },
      type: { type: "string", enum: ["regular", "VIP", "VVIP"] },
    },
  },
  response: {
    201: {
      type: "object",
      required: ["success", "ticketId", "message"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        ticketId: { type: "string", format: "uuid" },
        message: { type: "string" },
      },
    },
    400: errorResponseSchema,
      401: errorResponseSchema,
    403: errorResponseSchema,
    500: errorResponseSchema,
  },
};


export const listTicketSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      required: ["success", "detail", "message"],
      additionalProperties: true,
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        detail: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "event_id", "type"],
            additionalProperties: true,
            properties: {
              id: { type: "string", format: "uuid" },
              event_id: { type: "string", format: "uuid" },
              type: { type: "string" },
            },
          },
        },
      },
    },
  },
};