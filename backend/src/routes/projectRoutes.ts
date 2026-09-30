import { Router } from "express";
import * as controller from "../controllers/projectController";
import * as service from "../services/projectService";
import { asyncRoute, AppError } from "../lib/errors";
import { requireTenant } from "../middleware/tenantContext";

const router = Router();
router.use((req, _res, next) => {
  if (req.method !== "GET" && Object.keys(req.query).length)
    return next(
      new AppError(400, "Mutation routes do not accept query parameters."),
    );
  if (req.method !== "GET" && !req.is("application/json"))
    return next(new AppError(415, "Send application/json."));
  next();
});
router.get("/", asyncRoute(controller.getProjects));
router.post("/", asyncRoute(controller.createProject));
router.get(
  "/:id",
  asyncRoute(async (req, res) => {
    res.json(await service.getProject(requireTenant(req), req.params.id));
  }),
);
router.put(
  "/:id",
  asyncRoute(async (req, res) => {
    res.json(
      await service.updateProject(requireTenant(req), req.params.id, req.body),
    );
  }),
);
router.delete(
  "/:id",
  asyncRoute(async (req, res) => {
    res.json(
      await service.deleteProject(requireTenant(req), req.params.id, req.body),
    );
  }),
);
router.get(
  "/:id/audit",
  asyncRoute(async (req, res) => {
    res.json({
      items: await service.history(
        requireTenant(req),
        "PROJECT",
        req.params.id,
      ),
    });
  }),
);
router.get(
  "/:id/tasks",
  asyncRoute(async (req, res) => {
    res.json(
      await service.listTasks(requireTenant(req), req.params.id, req.query),
    );
  }),
);
router.post(
  "/:id/tasks",
  asyncRoute(async (req, res) => {
    const row = await service.createTask(
      requireTenant(req),
      req.params.id,
      req.body,
    );
    res
      .location(`/api/projects/${req.params.id}/tasks/${row.id}`)
      .status(201)
      .json(row);
  }),
);
router.get(
  "/:id/tasks/:taskId",
  asyncRoute(async (req, res) => {
    res.json(
      await service.getTask(
        requireTenant(req),
        req.params.id,
        req.params.taskId,
      ),
    );
  }),
);
router.put(
  "/:id/tasks/:taskId",
  asyncRoute(async (req, res) => {
    res.json(
      await service.updateTask(
        requireTenant(req),
        req.params.id,
        req.params.taskId,
        req.body,
      ),
    );
  }),
);
router.delete(
  "/:id/tasks/:taskId",
  asyncRoute(async (req, res) => {
    res.json(
      await service.deleteTask(
        requireTenant(req),
        req.params.id,
        req.params.taskId,
        req.body,
      ),
    );
  }),
);
export default router;
