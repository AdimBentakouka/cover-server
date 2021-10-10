import { Router } from "express";
import readerRoutes from "./reader.routes";
import metadataRoutes from "./metadata.routes";

const routes = Router();

routes.use("/reader", readerRoutes);
routes.use("/metadata", metadataRoutes);

export = routes;