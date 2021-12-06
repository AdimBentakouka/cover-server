import { Router } from "express";
import readerRoutes from "./reader.routes";
import metadataRoutes from "./metadata.routes";
import userRoutes from "./user.routes";

const routes = Router();

routes.use("/reader", readerRoutes);
routes.use("/metadata", metadataRoutes);
routes.use("/user/", userRoutes);

export = routes;