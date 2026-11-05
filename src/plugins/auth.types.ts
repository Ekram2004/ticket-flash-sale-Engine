import "@fastify/jwt";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: UserPayload;
  }
}
