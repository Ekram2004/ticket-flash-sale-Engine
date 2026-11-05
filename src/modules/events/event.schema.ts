import { type FastifySchema } from "fastify";


export interface EventInput{
    title: string,
    location: string;
    event_date: string;
    description: string;
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
 

export const createEventSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["title", "location", "event_date"],
    additionalProperties: false,
    properties: {
      title: { type: "string", minLength: 3, maxLength: 100 },
      location: { type: "string", minLength: 2, maxLength: 255},
      event_date: { type: "string", format: "date-time" },
      description:{type:"string", maxLength: 100}
    },
  },
  response: {
    201: {
      type: "object",
      required: ["success", "eventId", "message"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        eventId: { type: "string", format: "uuid" },
        message: { type: "string" },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema,
  },
};