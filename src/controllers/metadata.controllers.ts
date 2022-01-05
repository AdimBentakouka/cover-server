import { Request, Response } from "express";
import { Sequelize } from "sequelize";
import fs from "fs";

import Metadata from "../utils/metadata/metadata";

import { Volume } from "../models/";



let _metadata: Metadata | null = null;

/**
 * Permet de connecter la metadonnées du controller à une metadonnée exterieur
 * @param metadata 
 */
export const initMetadataController = (metadata: Metadata): void => {
     _metadata = metadata;
};

/**
 *  Permet de récupérer toutes les collections
 * @param req 
 * @param res 
 */
export const getCollections = (req: Request, res: Response): void => {
     Volume.findAll({
          attributes: [
               "id",
               ["collectionName", "name"],
               [Sequelize.col("volumes.cover"), "cover"],
               [Sequelize.fn("COUNT", Sequelize.col("*")), "nbVolumes"],
               "createdAt",
               "updatedAt"

          ],

          group: "collectionName",
          order: [
               ["collectionName", "asc"],
               ["name", "asc"]
          ]
     }).then((data) => {
          res.send(data);
     }).catch((err) => {
          res.send(err);
     });
};


/**
 * * Retourne les volumes d'une collection
 * @params req.params.nameCollection nom de la collection à afficher
 */
export const getVolumes = (req: Request, res: Response): void => {
     Volume.findAll({
          attributes: ["id", "name", "nbPages", "cover", "createdAt"],
          where: {
               collectionName: req.params.nameCollection
          },
          order: [
               ["name", "asc"]
          ]
     }).then((data) => {
          res.send(data);
     })
          .catch((err) => {
               res.send(err);
          });
};

/**
 * Permet de récupérer la liste des élements analysées
 * @param req Request
 * @param res Response
 */
export const getQueueAnalyze = (req: Request, res: Response): void => {
     if (_metadata) {
          res.send(_metadata.getAnalyze());
     }
     else {
          res.send([]);
     }

};

/**
 * Retourne la couverture 
 * @params covername le nom de la couverture
 */

export const getCover = (req: Request, res: Response): void => {

     fs.readFile("./public/cover/" + req.params.covername, (err, data) => {

          if (err) {
               console.log(err);
          }
          res.set({ "Content-Type": "image/*" });
          res.send(data);
     });

};