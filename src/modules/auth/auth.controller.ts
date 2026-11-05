import { type FastifyRequest, type FastifyReply } from "fastify";
import { UserService } from "./auth.services.js";
import { type LoginUserInput, type RegisterUserInput } from "./auth.schema.js";

export class RegisterUserController {
  private registerUserService: UserService;

  constructor() {
    this.registerUserService = new UserService();
  }

  registerUserHandler = async(
    request: FastifyRequest<{ Body: RegisterUserInput }>,
    reply: FastifyReply,
  )=> {
    const { name, email, password } = request.body;
    const userId = await this.registerUserService.register(
      name,
      email,
      password,
    );
    return reply.status(201).send({
      success: true,
      userId,
      message: "User successfully registered!",
    });
  }
}

export class LoginUserController {
  private loginUserService: UserService;

  constructor() {
    this.loginUserService = new UserService();
  }

  loginUserHandler = async(
    request: FastifyRequest<{ Body: LoginUserInput }>,
    reply: FastifyReply,
  )=> {
    const { email, password } = request.body;

    const authResult = await this.loginUserService.login(email, password);

    reply.setCookie("access_token", authResult.accessToken, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600,
    });
    return reply.status(200).send({
      success: true,
      message: "User successfully log in",
    });
  }
}
