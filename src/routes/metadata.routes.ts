import { Router } from "express";
import * as metadataControllers from "../controllers/metadata.controllers";

import * as authMiddleware from "../middlewares/auth.middleware";

const metadataRouter = Router();

metadataRouter.get("/", authMiddleware.authentificate, metadataControllers.getCollections);
metadataRouter.get("/getAnalyze", authMiddleware.authentificate, metadataControllers.getQueueAnalyze);
metadataRouter.get("/getCover/:covername", metadataControllers.getCover);
metadataRouter.get("/:nameCollection", authMiddleware.authentificate, metadataControllers.getVolumes);

export default metadataRouter;
