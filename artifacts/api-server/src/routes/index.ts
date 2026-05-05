import { Router, type IRouter } from "express";
import healthRouter from "./health";
import transactionsRouter from "./transactions";
import alertsRouter from "./alerts";
import casesRouter from "./cases";
import rulesRouter from "./rules";
import usersRouter from "./users";
import merchantsRouter from "./merchants";
import sarRouter from "./sar";
import dashboardRouter from "./dashboard";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(transactionsRouter);
router.use(alertsRouter);
router.use(casesRouter);
router.use(rulesRouter);
router.use(usersRouter);
router.use(merchantsRouter);
router.use(sarRouter);
router.use(dashboardRouter);
router.use(analyticsRouter);

export default router;
