import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { IGetUserAuthInfoRequest } from "../types/express/";

export function authentificate(req: IGetUserAuthInfoRequest, res: Response, next: NextFunction): void {
	const authHeader = req.headers["token"] as string;

	if (!authHeader) {
		res.status(401).send("Token not found !");
	} else {
		jwt.verify(authHeader, process.env.JWT_KEY_TOKEN, (err, decoded) => {
			if (err) {
				res.status(401).send(err || "Invalid token");
			} else {
				req.user = {
					id: decoded.id,
					email: decoded.email,
					username: decoded.username,
					isAdmin: decoded.isAdmin ? decoded.isAdmin : false,
				};
				next();
			}
		});
	}
}
