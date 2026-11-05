import { type FastifyRequest, type FastifyReply } from "fastify";
import jwt from "jsonwebtoken";


export async function authenticateSession(request: FastifyRequest, reply: FastifyReply) {
    try {
        const cookies = (request as FastifyRequest & {
            cookies: Record<string, string | undefined>;
        }).cookies;
        const token = cookies.access_token || cookies.token;

    if (!token) {
        return reply.status(401).send({
          status: "UNAUTHORIZED",
          message: "Authentication required. No session found.",
        });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

        (request as any).user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
    } catch (error) {
        return reply.status(401).send({
            status: "UNAUTHORIZED",
            message: "Invalid or expired session token."
        });
    }
}