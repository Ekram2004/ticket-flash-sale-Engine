import { type FastifyRequest, type FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { type UserPayload } from "./auth.types.js";


export async function authenticateSession(request: FastifyRequest, reply: FastifyReply) {
    const token = request.cookies.access_token || request.cookies.token;

    if (!token) {
        return reply.status(401).send({
            error: "Unauthorized",
            message: "Authentication required. No session found."
        });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("FATAL: JWT_SECRET variable is missing from configuration!");
        }

        const decoded = jwt.verify(token, secret) as UserPayload;

        request.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        }
    } catch (error) {
        return reply.status(401).send({
            status: "UNAUTHORIZED",
            message: "Invalid or expired session token."
        });
    }
}