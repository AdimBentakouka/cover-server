import errorHandler from "errorhandler";
import "./config/dotenv.config";
import app from "./app";


/**
 * Error Handler. Provides full stack
 */
if (process.env.NODE_ENV === "development") {
    app.use(errorHandler());
}


/**
 * Start Express server.
 */
const server = app.listen(app.get("port"), () => {
    console.log(
        " Server start on http://localhost:%d in %s mode",
        app.get("port"),
        app.get("env")
    );

});

export default server;