import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import vehiclesRouter from "./vehicles";
import bookingsRouter from "./bookings";
import usersRouter from "./users";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/vehicles", vehiclesRouter);
router.use("/bookings", bookingsRouter);
router.use("/users", usersRouter);
router.use("/dashboard", dashboardRouter);

export default router;
