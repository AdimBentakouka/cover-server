import path from "path";
import * as fs from "fs";
import sharp from "sharp";

import { Collection, Volume, sequelize } from "../models/";
import { countPage, getPage } from "./readerVolume";
import Sequelize from "sequelize";

type typeVolume = {
     nameCollection?: string, // Nom de la collection dont il appartient
     nameVolume?: string, // Nom du volume
     filepath: string, // chemin du volume
     action: string, // ["add", "check", "delete", "update"]
     errorMsg?: string,
};

/**
 * Classe qui gère les métadonnées de l'application
 *
 * @export
 * @class Metadata
 */

export default class Metadata {
     private extAllowed: string[] = [".cbz", ".cbr", ".zip", ".rar"]
     private queueAnalyze: typeVolume[] = [];

     /**
      * * Permet de vérifier la présence d'un volume, de l'ajouter / mettre à jour 
      * * si non existant ou la taille du fichier à changer
      *
      * @private
      * @param {typeVolume} infoVolume
      * @return {*}  {Promise<void>}
      * @memberof Metadata
      */
     private checkVolume(infoVolume: typeVolume): Promise<void> {

          return new Promise<void>(async (resolve) => {

               // récupère la collection en base
               const _volume = await Volume.findOne({ where: { filename: infoVolume.filepath } });
               // volume existe
               if (_volume) {

                    fs.stat(infoVolume.filepath, (err, stats) => {
                         if (err) {
                              console.log(err);
                              resolve();
                         }
                         else {
                              if (stats.size !== _volume.sizefile) {
                                   this.addVolume(infoVolume);
                              }

                              resolve();
                         }
                    });
               }
               else {
                    // si existe pas
                    await this.addVolume(infoVolume);

                    resolve();
               }
          });
     }

     /**
      * * Ajout un volume à la database
      *
      * @private
      * @param {typeVolume} infoVolume
      * @return {*}  {Promise<void>}
      * @memberof Metadata
      */
     private addVolume(infoVolume: typeVolume): Promise<void> {
          return new Promise<void>((resolve) => {
               // traitement
               countPage(infoVolume.filepath)
                    .then((nbPages: number) => {

                         // Lire premiere page est l'enregistrer sous le format nameCollection-nameVolume.jpg
                         getPage(infoVolume.filepath)
                              .then(async (page: Buffer) => {

                                   const pathCover = path.basename(this.createCover(infoVolume, page));
                                   // récupérer la taille du fichier 
                                   fs.stat(infoVolume.filepath, async (err, stats) => {
                                        if (err) {
                                             console.log(err);
                                             resolve();
                                        }

                                        const tAddVolume = await sequelize.transaction();

                                        let _collection = await Collection.findOne({
                                             where: { name: infoVolume.nameCollection },
                                             transaction: tAddVolume
                                        });

                                        if (!_collection) {
                                             _collection = await Collection.create({
                                                  name: infoVolume.nameCollection,
                                             }, { transaction: tAddVolume });
                                        }

                                        let _volume = await Volume.findOne({
                                             where: {
                                                  name: infoVolume.nameVolume,
                                                  collectionId: _collection.id
                                             },
                                             transaction: tAddVolume
                                        });

                                        if (!_volume) {
                                             _volume = await Volume.create({
                                                  name: infoVolume.nameVolume,
                                                  filename: infoVolume.filepath,
                                                  nbPages: nbPages,
                                                  collectionId: _collection.id,
                                                  cover: pathCover,
                                                  sizefile: stats.size
                                             }, { transaction: tAddVolume });
                                        }
                                        else {
                                             _volume.name = infoVolume.nameVolume;
                                             _volume.filename = infoVolume.filepath;
                                             _volume.nbPages = nbPages;
                                             _volume.collectionId = _collection.id;
                                             _volume.cover = pathCover;
                                             _volume.sizefile = stats.size;
                                             await _volume.save({ transaction: tAddVolume });
                                        }

                                        await tAddVolume.commit();
                                        resolve();
                                   });
                              })
                              .catch((err: string) => {
                                   console.error(err);
                                   resolve();
                              });
                    })
                    .catch((err: string) => {
                         console.error(err);
                         resolve();
                    });
          });
     }


     /**
      * * Supprimer un volume de la database
      *
      * @private
      * @param {typeVolume} infoVolume
      * @return {*}  {Promise<void>}
      * @memberof Metadata
      */
     private async removeVolume(infoVolume: typeVolume): Promise<void> {
          return new Promise<void>(async (resolve) => {
               // pas de message d'erreur
               if (!infoVolume.errorMsg) {

                    const tRemoveVolume = await sequelize.transaction();

                    const _volume = await Volume.findOne({
                         where: { filename: infoVolume.filepath },
                         transaction: tRemoveVolume
                    });

                    if (_volume) {

                         this.removeCover(infoVolume);

                         const collectionId = _volume.collectionId;
                         await _volume.destroy({ transaction: tRemoveVolume });

                         // Compter le nombre de collection toujours présent
                         const countVolume = await Volume.count({ where: { collectionId: collectionId }, transaction: tRemoveVolume });

                         if (countVolume === 0) {
                              const _collection = await Collection.findOne({ where: { id: collectionId }, transaction: tRemoveVolume });
                              await _collection.destroy({ transaction: tRemoveVolume });
                         }
                    }

                    await tRemoveVolume.commit();
               }
               else {
                    console.warn("Warn: " + infoVolume.errorMsg);
               }
               resolve();
          });
     }


     /**
      * * Calculer le nom du fichier sa collection
      * @param filepath chemin du fichier a obtenir les informations
      * @returns typeVolume 
      */
     private getInfoVolume(filepath: string, action: string): typeVolume {

          if (this.extAllowed.includes(path.extname(filepath))) {

               const nameCollection = path.basename(path.dirname(filepath));
               const nameVolume = this.calcNameVolume(path.basename(filepath), nameCollection);

               return {
                    nameCollection: nameCollection,
                    nameVolume: nameVolume,
                    filepath: filepath,
                    action: action
               };
          }

          return {
               filepath: filepath,
               errorMsg: path.extname(filepath) ? `l'extension ${path.extname(filepath)} n'est pas géré !` : "le fichier n'a pas d'extension",
               action: "err"
          };
     }


     /**
      * * Permet de calculer le nom du volume afin d'avoir que le TXX ou CHAP XX ou encore XXX
      *
      * @param {string} nameVolume le nom a traiter
      * @param {string} nameCollection le nom de la collection a soustraire de la chaine de caractère
      * @return string  {string} nom du volume calculé
      * @memberof Metadata
      */
     private calcNameVolume(nameVolume: string, nameCollection: string): string {
          const regexNumberVolume = /(?:T|chap|^)\s*(\d{1,})/;
          const _nameVolume = nameVolume.match(regexNumberVolume);

          if (_nameVolume) {
               return _nameVolume[0];
          }

          return nameVolume
               .replace(path.extname(nameVolume), "") // extension
               .toUpperCase()
               .replace(nameCollection.toUpperCase(), "") // nom de la collectiohn
               .replace(" ", ""); // retirer les espaces
               
     }


     /**
      * * Enregistre le fichier de la couverture
      *
      * @private
      * @param {typeVolume} infoVolume
      * @param {Buffer} cover
      * @return {*}  {string} nom du fichier crée
      * @memberof Metadata
      */
     private createCover(infoVolume: typeVolume, cover: Buffer): string {
          fs.mkdir(process.env.COVER_STORAGE,
               {
                    recursive: true
               }, (err) => {
                    if (err) {
                         return err.message;
                    }

               }
          );

          const filename = `${process.env.COVER_STORAGE}/${infoVolume.nameCollection}-${infoVolume.nameVolume}.jpg`;

          sharp(cover).resize({ width: 190, height: 286 }).toFile(filename);

          return filename;
     }


     /**
      * * Supprime la couverture
      *
      * @private
      * @param {typeVolume} infoVolume
      * @memberof Metadata
      */
     private removeCover(infoVolume: typeVolume): void {
          const filename = `${process.env.COVER_STORAGE}/${infoVolume.nameCollection}-${infoVolume.nameVolume}.jpg`;

          fs.unlink(filename, (err) => {
               if (err) { console.error(err); }
          });
     }


     /**
      * * Permet de traiter la queue d'analyze
      *
      * @private
      * @return {*}  {Promise<void>}
      * @memberof Metadata
      */
     private async traiter(): Promise<void> {

          //bloquer les autres appel à traiter
          if (this.queueAnalyze.length === 1) {
               //parcours al liste des volumes à anlyser
               while (this.queueAnalyze.length > 0) {
                    const queue = this.queueAnalyze[0];

                    switch (queue.action) {
                         case "add":
                              await this.addVolume(queue);
                              break;
                         case "check":
                              await this.checkVolume(queue);
                              break;
                         case "delete":
                              await this.removeVolume(queue);
                              break;
                         default:
                              console.log("[traitement]: Action non géré !");
                    }

                    this.removeQueueAnalyze(queue);
               }
          }
          //console.log("finis");
     }


     /**
      *  *Retourne les analyze en cours
      * @public
      * @return typeVolume[]
      */
     public getAnalyze(): typeVolume[] {
          return this.queueAnalyze;
     }


     /**
      * * Permet d'analyser un volume et de l'ajouter au metadonnées
      * @param filepath chemin du fichier à analyser
      */
     public Analyze(filepath: string, action: string = "add"): void {
          const info: typeVolume = this.getInfoVolume(filepath, action);

          // pas de message d'erreur
          if (!info.errorMsg) {
               // ajoute a la liste des traitements
               this.queueAnalyze.push(info);
               this.traiter();
          }
          else {
               console.warn("Warn: " + info.errorMsg);
          }

     }


     /**
      * * Permet de supprimer les volumes qui ne sont pas présents dans un tableau de string
      * @public
      * @param {string[]} filepaths filepath des volumes à conserver
      * @return {*}  {Promise<void>}
      * @memberof Metadata
      */
     public async CleanVolume(filepaths: string[]): Promise<void> {

          const volumes = await Volume.findAll({
               where: {
                    filename: {
                         [Sequelize.Op.notIn]: filepaths
                    }
               }
          });

          for (const volume of volumes) {

               await this.removeVolume(this.getInfoVolume(volume.filename, "delete"));

          }
     }



     /**
      * * utilitaire - pour supprimer un element de la queue
      *
      * @private
      * @param {typeVolume} volume
      * @memberof Metadata
      */
     private removeQueueAnalyze(volume: typeVolume): void {
          const indexQueue = this.queueAnalyze.indexOf(volume);
          this.queueAnalyze.splice(indexQueue, 1);
     }


}
