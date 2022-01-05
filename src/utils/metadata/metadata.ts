import path from "path";
import to from "await-to-js";
import * as fs from "fs";
import sharp from "sharp";
import Sequelize from "sequelize";

import { Queue } from "./index";

import { Volume } from "../../models/";

import { countPage, getPage } from "../readerVolume";
import Logger from "../../helpers/logger";

const logger = new Logger("Metadata");

/**
 * Classe qui gère les métadonnées de l'application
 *
 * @export
 * @class Metadata
 */
export default class Metadata {

    // Les extensions des fichiers pris en charge
    private extAllowed: string[] = [".cbz", ".zip", ".cbr", ".rar"];
    private queue: Queue[] = [];

    /**
     * Ajouter un volume
     *
     * @private
     * @param {string} filepath
     * @return {*}  {Promise<void>}
     * @memberof Metadata
     */
    private async addVolume(filepath: string): Promise<void> {


        const volume = await Volume.findOne({ where: { filename: filepath } });


        const [errStat, statVolume] = await to(this.getStat(filepath));

        if (errStat) {
            logger.error(JSON.stringify(errStat));
            return;
        }

        if (volume && volume.sizefile === statVolume.size) {
            return;
        }

        if (volume) {
            //suppression du volume pour le regénéré
            volume.destroy();

        }

        //const collectionName = path.basename(path.dirname(filepath));
        const [errNbPages, nbPages] = await to(countPage(filepath));

        if (errNbPages) {
            logger.error(JSON.stringify(errNbPages));
            return;
        }

        const collectionName = path.basename(path.dirname(filepath));
        const volumeName = this.getNameVolume(path.basename(filepath), collectionName);

        const [errCoverName, coverName] = await to(this.generateCover(collectionName, volumeName, filepath));

        if (errCoverName) {
            logger.error(JSON.stringify(errCoverName));
            return;
        }


        Volume.create({
            name: volumeName,
            filename: filepath,
            nbPages: nbPages,
            cover: coverName,
            sizefile: statVolume.size,
            collectionName: collectionName
        });


    }


    private async removeVolume(filepath: string): Promise<void> {

        const volume = await Volume.findOne({ where: { filename: filepath } });

        const { collectionName, cover } = volume;

        await volume.destroy();

        if (cover !== `${collectionName}.jpg`) {
            this.removeCover(cover);
            return;
        }


        const nbVolumes = await Volume.count({
            where: {
                collectionName: collectionName
            }
        });

        if (nbVolumes === 0) {
            this.removeCover(cover);
        }

    }


    private async createCover(fileName: string, cover: Buffer): Promise<void> {

        fs.mkdir(process.env.COVER_STORAGE,
            {
                recursive: true
            }, (err) => {
                if (err) {
                    return err.message;
                }
            }
        );

        const filepath = `${process.env.COVER_STORAGE}/${fileName}.jpg`;

        await sharp(cover).resize({ width: 190, height: 286 }).toFile(filepath);
    }

    private async removeCover(filename: string) {
        const filepath = `${process.env.COVER_STORAGE}\\${filename}`;

        fs.unlink(filepath, (err) => {
            if (err) {
                logger.error(`Echec de la suppression de la couverture "${filename}"`);
            }
        });
    }

    private generateCover(collectionName: string, volumeName: string, filepath: string): Promise<string> {

        return new Promise<string>(async (resolve, reject) => {

            const coverStore = `${process.env.COVER_STORAGE}/${collectionName}.jpg`;
            const [errCoverStat] = await to(this.getStat(coverStore));

            // cover.jpg n'est pas déjà généré
            if (errCoverStat) {
                // check si cover.jpg présent dans le répertoire
                const coverJPG = `${path.dirname(filepath)}/cover.jpg`;
                const [errCoverJPGStat, JPGStat] = await to(this.getStat(coverJPG));

                if (errCoverJPGStat) {

                    const [errCoverDefault, coverDefault] = await to(getPage(filepath));

                    if (errCoverDefault) {
                        reject(`echec de la génération de la couverture ${path.basename(filepath)}`);
                    }
                    const coverFileName = `${collectionName}-${volumeName}`;
                    this.createCover(coverFileName, coverDefault);

                    resolve(`${coverFileName}.jpg`);
                }

                if (JPGStat) {

                    const cover = fs.readFileSync(coverJPG);
                    this.createCover(collectionName, cover);
                }


            }


            resolve(`${collectionName}.jpg`);
        });

    }

    private getNameVolume(volumeName: string, collectionName: string): string {

        const regexNumberVolume = /(?:T|chap|^)\s*(\d{1,})/;
        const _volumeName = volumeName.match(regexNumberVolume);
        if (_volumeName) {
            return _volumeName[0];
        }
        return volumeName
            .replace(path.extname(volumeName), "") // extension
            .toUpperCase()
            .replace(collectionName.toUpperCase(), "") // nom de la collectiohn
            .replace(" ", "");
    }
    /**
     * Promesse pour avoir les stats d'un volume
     */
    private async getStat(filepath: string): Promise<fs.Stats> {
        return new Promise<fs.Stats>((resolve, reject) => {
            fs.stat(filepath, (err, stats) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(stats);
                }
            });
        });
    }

    // traitement de la file
    private async traiter(): Promise<void> {

        while (this.queue.length > 0) {
            const currentQueue = this.queue[0];

            logger.info(`Traitement du fichier ${path.basename(currentQueue.filepath)}`);

            switch (currentQueue.action) {
                case "add":
                    await this.addVolume(currentQueue.filepath);
                    break;
                case "delete":
                    await this.removeVolume(currentQueue.filepath);
                    break;
                default:
                    logger.warn(`Action non géré : ${currentQueue.action}`);
            }

            logger.info(`Fin du traitement du fichier ${path.basename(currentQueue.filepath)}`);

            this.popQueue(currentQueue.filepath);

            logger.info(`Traitement restant: ${this.queue.length}`);
        }

    }


    /**
     * Ajouter un item dans la file de traitement
     */
    private enqueue(filepath: string, action: string = "add"): void {
        this.queue.push({ filepath, action });

    }
    /**
     * Retirer un item de la file d'attente
     * @param filepath chemin du fichier à rétirer de la file de traitement
     */
    private popQueue(filepath: string): void {

        const indexQueue = this.queue.findIndex(item => item.filepath === filepath);
        this.queue.splice(indexQueue, 1);
    }


    /**
     * Permet d'analyser un fichier pour générer / modifier / supprimer une métadata
     */
    public Analyse(filepath: string, action: string): void {
        this.enqueue(filepath, action);

        if (this.queue.length === 1) {
            logger.info("Debut du traitement");
            this.traiter();
            logger.info("Fin du traitement");
        }
    }

    public async cleanVolume(filepaths: string[]): Promise<void> {

        logger.info("Début du nettoyage");

        const volumes = await Volume.findAll({
            where: {
                filename: {
                    [Sequelize.Op.notIn]: filepaths
                }
            }
        });

        for (const volume of volumes) {
            this.Analyse(volume.filename, "delete");
        }

        logger.info("Fin du nettoyage");

    }

    /**
     * Vérifie si l'extension est autorisée
     * @returns true si pris en charge par la class Metadata
     */
    public extIsAllowed(name: string): boolean {
        const ext = path.extname(name);
        return this.extAllowed.includes(ext);
    }


    /**
     * @returns la file de traitement
     */
    public getAnalyze(): Queue[] {
        return this.queue;
    }

}

