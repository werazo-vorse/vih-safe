import { Router, type IRouter } from "express";
import { CLINICS } from "../data/clinics.js";

const router: IRouter = Router();

router.get("/resources/clinics", (_req, res) => {
  res.json({ clinics: CLINICS });
});

export default router;
