import { Router } from "express";
import * as readerController from "../controllers/reader.controllers";


const readerRouter = Router();

readerRouter.get("/:id/:page", readerController.routeGetPage);
export default readerRouter;