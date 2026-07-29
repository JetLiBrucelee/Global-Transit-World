import { Router, type IRouter } from "express";
import healthRouter from "./health";
import shipmentsRouter from "./shipments";
import trackingRouter from "./tracking";
import holdsRouter from "./holds";
import customersRouter from "./customers";
import usersRouter from "./users";
import warehousesRouter from "./warehouses";
import cmsRouter from "./cms";
import quotesRouter from "./quotes";
import notificationsRouter from "./notifications";
import auditRouter from "./audit";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(shipmentsRouter);
router.use(trackingRouter);
router.use(holdsRouter);
router.use(customersRouter);
router.use(usersRouter);
router.use(warehousesRouter);
router.use(cmsRouter);
router.use(quotesRouter);
router.use(notificationsRouter);
router.use(auditRouter);
router.use(dashboardRouter);

export default router;
