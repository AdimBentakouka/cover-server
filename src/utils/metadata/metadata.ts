import to from "await-to-js";
import * as fs from "fs";
import path from "path";
import sharp from "sharp";
import Sequelize from "sequelize";

import { Queue } from ".";
import Logger from "../../helpers/logger";
import { Collection, Volume } from "../../models";
import { CollectionModel } from "../../models/collection.model";
import { countPage, getPage } from "../readerVolume";

const logger = new Logger("Metadata");

const NAME_COVER_COLLECTION = process.env.NAME_COVER_COLLECTION || "cover.jpg";
const COVER_STORAGE = process.env.COVER_STORAGE;

/**
 * Classe qui gère les métadonnées de l'application
 *
 * @export
 * @class Metadata
 */
export default class Metadata {
	private extAllowed: string[] = [".cbz", ".cbr", ".zip", ".rar"];
	private queue: Queue[] = [];

	// ! private methode

	/**
	 *  Génère la métadata d'un volume
	 */
	private async addVolume(filepath: string): Promise<void> {
		const [errStatVolume, statVolume] = await to(this.getStat(filepath));

		if (errStatVolume) {
			logger.error(JSON.stringify(errStatVolume));
			return;
		}

		const volume = await Volume.findOne({ where: { filename: filepath } });

		if (volume?.sizefile === statVolume.size) {
			logger.info("Aucun changement détécté !");
			return;
		}

		const [errNbPages, nbPages] = await to(countPage(filepath));

		if (errNbPages) {
			logger.error(JSON.stringify(errNbPages));
			return;
		}

		const collectionName = path.basename(path.dirname(filepath));
		const volumeName = this.getNameVolume(path.basename(filepath), collectionName);

		const coverName = `${collectionName}-${volumeName}.jpg`;

		this.createVolumeCover(filepath, coverName).catch((err) => {
			logger.error(JSON.stringify(err));
			return;
		});

		if (volume) {
			volume.name = volumeName;
			volume.nbPages = nbPages;
			volume.cover = coverName;

			volume.save();
			return;
		}

		const collection = await this.getCollection(path.dirname(filepath));

		if (!collection.cover) {
			collection.cover = coverName;
			collection.save();
		}

		Volume.create({
			name: volumeName,
			filename: filepath,
			nbPages: nbPages,
			cover: coverName,
			sizefile: statVolume.size,
			collectionId: collection.id,
		});

		return;
	}

	/**
	 *  Supprime une metadata
	 */

	private async removeVolume(filepath: string): Promise<void> {
		const volume = await Volume.findOne({ where: { filename: filepath } });

		if (volume) {
			const volumeCover = volume.cover;
			const collectionId = volume.collectionId;

			// suppression de la couverture
			await volume.destroy();
			this.removeCover(volumeCover);

			const nbVolumes = await Volume.count({ where: { collectionId: collectionId } });

			// suppression de la collection si 0 volumes
			if (nbVolumes === 0) {
				this.removeCollection(collectionId);
			}
		}
	}
	/**
	 * Ajouts un item à la liste de traitements
	 * @param filepath chemin du fichier
	 * @param action "add", "update", "delete" action à faire
	 */
	private enqueue(filepath: string, action: string): void {
		logger.info(`Ajouts à la liste de traitements ${path.basename(filepath)} - ${action}`);
		this.queue.push({ action, filepath });
	}

	/**
	 * Retirer un item à la liste de traitements
	 * @param filepath chemin du fichier
	 */
	private popqueue(filepath: string): void {
		logger.info(`${path.basename(filepath)} - traité !`);

		const index = this.queue.findIndex((item) => item.filepath === filepath);

		this.queue.splice(index, 1);
	}

	/**
	 * Retourne la collection de l'élement
	 */
	private async getCollection(folderpath: string): Promise<CollectionModel> {
		const collectionName = path.basename(folderpath);

		let collection = await Collection.findOne({ where: { name: collectionName } });

		if (!collection) {
			collection = await this.addCollection(folderpath);
		}

		return collection;
	}

	/**
	 *  Créer une collection
	 */
	private async addCollection(folderpath: string): Promise<CollectionModel> {
		const collectionName = path.basename(folderpath);

		logger.info(`Création de la collection ${collectionName}`);

		const coverPath = `${folderpath}/${NAME_COVER_COLLECTION}`;

		const coverName = await this.createCollectionCover(collectionName, coverPath);

		return await Collection.create({ name: collectionName, cover: coverName });
	}

	/**
	 * Suppression d'une colelction
	 */

	private async removeCollection(collectionId: number): Promise<void> {
		const collection = await Collection.findOne({ where: { id: collectionId } });

		this.removeCover(collection.cover);
		collection.destroy();
	}

	private async createVolumeCover(filepath: string, coverName: string): Promise<void> {
		return new Promise<void>(async (resolve, reject) => {
			getPage(filepath)
				.then((cover) => {
					this.createCover(coverName, cover);

					resolve();
				})
				.catch((err) => {
					reject(err);
				});
		});
	}

	private async createCollectionCover(collectionName: string, coverpath: string): Promise<string> {
		const [errStatCover, statCover] = await to(this.getStat(coverpath));

		if (errStatCover) {
			logger.warn("Pas de couverture de collection trouvé !");
			return null;
		}

		if (statCover) {
			logger.info("Génération de la couverture");
			const cover = fs.readFileSync(coverpath);
			const coverName = `${collectionName}.jpg`;

			this.createCover(coverName, cover);

			return coverName;
		}
	}

	/**
	 * Création de la couvertuire
	 */
	private createCover(filename: string, cover: Buffer): void {
		fs.mkdir(
			COVER_STORAGE,
			{
				recursive: true,
			},
			(err) => {
				if (err) {
					return err.message;
				}
			}
		);

		const filepath = `${COVER_STORAGE}/${filename}`;

		sharp(cover).resize({ width: 190, height: 286 }).toFile(filepath);
	}

	/**
	 * Retire la couverture
	 */
	private removeCover(covername: string): void {
		Volume.count({ where: { cover: covername } })
			.then((nb) => {
				console.log(covername, nb);
				if (nb === 0) {
					const filepath = `${COVER_STORAGE}/${covername}`;

					fs.unlink(filepath, (err) => {
						if (err) {
							logger.error(`Echec de la suppression de la couverture "${covername}"`);
						}
					});
				}
			})
			.catch((err) => logger.error(JSON.stringify(err)));
	}

	/**
	 * Génération du nom du volume
	 */
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
				} else {
					resolve(stats);
				}
			});
		});
	}

	/**
	 *  Dispatch la liste de traitements
	 */
	private async traiter(): Promise<void> {
		while (this.queue.length > 0) {
			const currentQueue = this.queue[0];

			logger.info(`Traitements en cours: ${JSON.stringify(currentQueue)}`);

			switch (currentQueue.action) {
				case "add":
					await this.addVolume(currentQueue.filepath);
					break;
				case "remove":
					await this.removeVolume(currentQueue.filepath);
					break;
				default:
					logger.warn(`Action non géré : ${currentQueue.action}`);
			}

			this.popqueue(currentQueue.filepath);

			logger.info(`${this.queue.length} restant(s).`);
		}
	}

	// ! Public methode

	/**
	 * Ajouts à la liste de traitements un volume à analyser
	 * @param filepath chemin du fichier
	 * @param action "add", "update", "delete" action à faire
	 */
	public analyze(filepath: string, action: string): void {
		this.enqueue(filepath, action);

		if (this.queue.length === 1) {
			logger.info("Debut du traitement");

			this.traiter();

			logger.info("Fin du traitement");
		}
	}

	/**
	 * Retire les volumes inutiles
	 */
	public async cleanVolume(filepaths: string[]): Promise<void> {
		logger.info("Nettoyage");

		const volumes = await Volume.findAll({ where: { filename: { [Sequelize.Op.notIn]: filepaths } } });

		for (const volume of volumes) {
			this.analyze(volume.filename, "remove");
		}

		logger.info("Fin Nettoyage");
	}

	/**
	 * Check si l'extension du fichier est supporté
	 * @param filepath chemin du fichier
	 * @returns true si l'extension est supporté
	 */
	public extIsSupported(filepath: string): boolean {
		const ext = path.extname(filepath);
		return this.extAllowed.includes(ext);
	}

	/**
	 *
	 * @returns la liste de traitements
	 */
	public getAnalyze(): Queue[] {
		return this.queue;
	}
}
