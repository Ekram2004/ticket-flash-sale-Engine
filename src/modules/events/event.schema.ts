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



export const listEventsResponseSchema: FastifySchema = {
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
            required: ["id", "title", "location", "event_date"],
            additionalProperties: true,
            properties: {
              id: { type: "string", format: "uuid" },
              title: { type: "string" },
              location: { type: "string" },
              event_date: { type: ["string", "object"], format: "date-time" },
              description: { type: ["string", "null"] },
            },
          },
        },
      },
    },
  },
};
