import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import assessmentRouter from "./assessment.js";
import statsRouter from "./stats.js";
import chatbotRouter from "./chatbot.js";
import educationRouter from "./education.js";
import resourcesRouter from "./resources.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(assessmentRouter);
router.use(statsRouter);
router.use(chatbotRouter);
router.use(educationRouter);
router.use(resourcesRouter);

export default router;
