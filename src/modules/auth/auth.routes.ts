import { type FastifyInstance } from "fastify";
import {
  RegisterUserController,
  LoginUserController,
} from "./auth.controller.js";
import { registerUserSchema, userLoginSchema } from "./auth.schema.js";


export async function registerUserRoutes(fastify: FastifyInstance) {
  const controller = new RegisterUserController();

  fastify.post(
    "/register",
    { schema: registerUserSchema },
    controller.registerUserHandler,
  );
}

export async function loginUserRoutes(fastify: FastifyInstance) {
  const controller = new LoginUserController();

  fastify.post(
    "/login",
    { schema: userLoginSchema },
    controller.loginUserHandler
  );
}
