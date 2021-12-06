import * as bcrypt from "bcrypt";

import { User } from "../models/";
import Logger from "../helpers/logger";

import Watcher from "../utils/watchdir";
import {initMetadataController} from "../controllers/metadata.controllers";

const logger = new Logger("Init");

function initSuperAdminUser() {

    // console.log(process.env.SALT_BCRYPT);
     User.findOne({where: {email: process.env.ADMIN_EMAIL}}).then(user => {
          if(!user)
          {
               logger.info("Création du compte administrateur");
               
               User.create({
                    name: process.env.ADMIN_NAME,
                    email: process.env.ADMIN_EMAIL,
                    password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, parseInt(process.env.SALT_BCRYPT)),
                    accountValid: new Date(),
                    isAdmin: true
               }).then(() => {
                    logger.info("Compte administrateur créée !");
               }).catch((err) => {
                    logger.error("Echec de la création du compte administrateur");
                    logger.error(err);
               });
          }
     }).catch((err) => {
          logger.error("Echec de la vérification du compte administrateur.");
          logger.error(err);
     });
}

 
export default function init(): void {

     // Créer le premier compte administrateur
     initSuperAdminUser();
 
     // créer la classe qui génère l'écoute du dossier
     const watcher = new Watcher();

     // Connecter le Watcher au controller metadata
     initMetadataController(watcher.getMetadata());
 
}