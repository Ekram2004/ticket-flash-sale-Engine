import { type FastifyInstance } from "fastify";
import { EventController } from "./event.controller.js";
import { createEventSchema, type EventInput } from "./event.schema.js";
import { authenticateSession } from "../../plugins/authentication.js";
import { requireAdmin } from "../../plugins/hooks/rbac.hook.js";

export async function eventRoutes(fastify: FastifyInstance) {
    const eventController = new EventController();

    fastify.post<{Body: EventInput}>(
        "/events", {
            preHandler: [authenticateSession, requireAdmin],
            schema: createEventSchema
    },
        eventController.createEventHandler
    );
}