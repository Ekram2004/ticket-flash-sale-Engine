import { type FastifyInstance } from "fastify";
import { EventController } from "./event.controller.js";
import { createEventSchema, listEventsResponseSchema, type EventInput } from "./event.schema.js";
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
    fastify.get(
      "/events",
      { preHandler: [authenticateSession], schema: listEventsResponseSchema },
      eventController.fetchEventHandler,
    );
}