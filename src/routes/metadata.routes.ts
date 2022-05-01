import { Router } from "express";
import * as metadataControllers from "../controllers/metadata.controllers";

import * as authMiddleware from "../middlewares/auth.middleware";

const metadataRouter = Router();

metadataRouter.get("/", authMiddleware.authentificate, metadataControllers.getCollections);
metadataRouter.get("/getcurrentvolumes", authMiddleware.authentificate, metadataControllers.getVolumesRead);
metadataRouter.get("/getAnalyze", authMiddleware.authentificate, metadataControllers.getQueueAnalyze);
metadataRouter.get("/getCover/:covername", metadataControllers.getCover);
metadataRouter.get("/getSearchCollection", authMiddleware.authentificate, metadataControllers.getSearchCollection);
metadataRouter.get("/markRead/:id", authMiddleware.authentificate, metadataControllers.setReadVolume);
metadataRouter.get("/markUnread/:id", authMiddleware.authentificate, metadataControllers.setUnreadVolume);
metadataRouter.get("/markCollectionRead/:id", authMiddleware.authentificate, metadataControllers.setCollectionRead);
metadataRouter.get("/markCollectionUnread/:id", authMiddleware.authentificate, metadataControllers.setCollectionUnRead);

metadataRouter.get("/:nameCollection", authMiddleware.authentificate, metadataControllers.getVolumes);

export default metadataRouter;
