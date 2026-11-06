import { type FastifySchema } from "fastify";


export interface FlashSaleInput {
    event_id: string;
    title: string;
    start_time: string;
    end_time: string;
    status?: string;
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


export const createFlashSaleSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["event_id", "title", "start_time", "end_time"],
    additionalProperties: false,
    properties: {
      event_id: { type: "string", format: "uuid" },
      title: { type: "string", minLength: 3, maxLength: 100 },
      start_time: { type: "string", format: "date-time" },
      end_time: { type: "string", format: "date-time" },
      status: { type: "string", minLength: 2, maxLength: 100 },
    },
  },
  response: {
    201: {
      type: "object",
      required: ["success", "flashSaleId", "message"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        flashSaleId: { type: "string", format: "uuid" },
        message: { type: "string" },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
};

