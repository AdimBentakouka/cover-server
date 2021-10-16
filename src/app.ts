import express, { Application } from "express";

import {sequelize} from "./models";
import routes from "./routes/index";

import Watcher from "./utils/watchdir";
import {initMetadataController} from "./controllers/metadata.controllers";

import Logger from "./helpers/logger";

// Create Express server
const app : Application = express();

// Setup logger
const logger = new Logger("App");

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Metadata analyses
sequelize.sync({force: false}).then(async () => {
     logger.info("Database connected");

     // créer la classe qui génère l'écoute du dossier
     const watcher = new Watcher();

     // partager l'instance metadata au controller metadata
     initMetadataController(watcher.getMetadata());
});


// Add headers before the routes are defined
app.use(function (req, res, next) {

     // Website you wish to allow to connect
     res.setHeader("Access-Control-Allow-Origin", "*");
 
     // Request methods you wish to allow
     res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
 
     // Request headers you wish to allow
     res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
 
     res.setHeader("User-Agent","*");
 
     // Set to true if you need the website to include cookies in the requests sent
     // to the API (e.g. in case you use sessions)
     res.setHeader("Access-Control-Allow-Credentials", "true");
 
     // Pass to next layer of middleware
     next();
 });

// Routes
app.use(routes);

export default app;