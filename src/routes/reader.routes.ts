import { Router } from "express";
import * as readerController from "../controllers/reader.controllers";
import * as authMiddleware from "../middlewares/auth.middleware";

const readerRouter = Router();

readerRouter.get("/:id/:page", authMiddleware.authentificate, readerController.routeGetPage);

export default readerRouter;
