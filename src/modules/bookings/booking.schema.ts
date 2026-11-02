import { type FastifySchema } from "fastify";
import { format } from "path";


export interface BookTicketInput {
  flashSaleId: string;
  ticketId: string;
  userId: string;
}


export const bookTicketSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["flashSaleId", "ticketId", "userId"],
    properties: {
      flashSaleId: { type: "string", format: "uuid" },
      ticketId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        orderId: { type: "string", format: "uuid" },
        message: { type: "string" },
      },
    },
    400: {
      type: "object",
        properties: {
            error: { type: 'string' },
            message: {type:'string'}
      }
    },
  },
};