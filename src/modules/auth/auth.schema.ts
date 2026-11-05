import { type FastifySchema } from "fastify";

export interface RegisterUserInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginUserInput{
    email: string;
    password: string;
}

const errorResponseSchema = {
  type: "object",
  required: ["error", "message"],
  additionalProperties: false,
  properties: {
    error: { type: "string" },
    message: {type:"string"}
  }
};


export const registerUserSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["name", "email", "password"],
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 2, maxLength: 50},
      email: { type: "string", format:"email", maxLength:254},
      password: { type: "string", minLength: 8},
    },
  },
  response: {
    201: {
      type: "object",
      required: ["success","userId", "message"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        userId: {type:"string", format:"uuid"},
        message: { type: "string" },
      },
    },
    400: errorResponseSchema,
    409: errorResponseSchema,
    500: errorResponseSchema
  },
};

export const userLoginSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: { type: "string", format:"email", maxLength:254},
      password: { type: "string"},
    },
  },
  response: {
    200: {
      type: "object",
      required: ["success", "message"],
      additionalProperties: false,
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    500: errorResponseSchema
  },
};