import express, { Application } from "express";

import * as useragent from "express-useragent";


import { sequelize } from "./models";
import routes from "./routes/index";

import Logger from "./helpers/logger";

import init from "./config/init.config";

// Create Express server
const app: Application = express();

// Setup logger
const logger = new Logger("App");

// Express configuration
app.set("port", process.env.PORT || 3000);


app.use(useragent.express());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Setup bdd
sequelize.sync({ force: process.env.NODE_ENV === 'development' ? true : false }).then(async () => {
     logger.info("Database connected");

     //initialisation de l'application
     init();


});


// Add headers before the routes are defined
app.use(function (req, res, next) {

     // Website you wish to allow to connect
     res.setHeader("Access-Control-Allow-Origin", "*");

     // Request methods you wish to allow
     res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

     // Request headers you wish to allow
     res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type, token, refreshtoken");

     res.setHeader("User-Agent", "*");

     // Set to true if you need the website to include cookies in the requests sent
     // to the API (e.g. in case you use sessions)
     res.setHeader("Access-Control-Allow-Credentials", "true");

     // Pass to next layer of middleware
     next();
});

// Routes
app.use(routes);

export default app;