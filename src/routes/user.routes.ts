import { Router } from "express";


import * as userController from "../controllers/user.controllers";
import * as authMiddleware from "../middlewares/auth.middleware";


const userRouter = Router();

userRouter.post("/", userController.createUser);
userRouter.post("/login", userController.login);
userRouter.get("/refreshToken", userController.refreshToken);
userRouter.get("/admin/validaccount/:userid", authMiddleware.authentificate, userController.validaccount);
userRouter.get("/admin/getusers/", authMiddleware.authentificate, userController.getAllAccount);


export default userRouter;