import { Router } from "express";
import * as metadataControllers from "../controllers/metadata.controllers";


const metadataRouter = Router();

metadataRouter.get("/", metadataControllers.getCollections);
metadataRouter.get("/getAnalyze", metadataControllers.getQueueAnalyze);
metadataRouter.get("/getCover/:covername", metadataControllers.getCover);
metadataRouter.get("/:nameCollection", metadataControllers.getVolumes);

export default metadataRouter;