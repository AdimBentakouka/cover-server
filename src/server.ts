import ip from "ip";
import errorHandler from "errorhandler";
import "./config/dotenv.config";
import app from "./app";

import Logger from "./utils/logger";

const logger = new Logger("Server");

/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
	app.use(errorHandler());
}

/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), async () => {
	console.table();
	logger.info("-------------------------------------------------");
	logger.info("- Server start !");
	logger.info("- " + ip.address + ":" + app.get("port"));
	logger.info("- " + app.get("env") + " environment");
});

export default server;
