import { type FastifyReply, type FastifyRequest } from "fastify";


export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
    const currentUser = request.user;

    if (!currentUser) {
        return reply.status(401).send({
            error: "Unauthorized",
            message: "Authentication context is missing. Please authenticate first.",
        });
    }

    if (currentUser.role !== "admin") {
        return reply.status(403).send({
          error: "Forbidden",
          message:
            "Access denied. Administrative privileges are required for this action.",
        });
    }
}