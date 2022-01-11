import { Request, Response } from "express";
import { Sequelize } from "sequelize";
import fs from "fs";
import Metadata from "../utils/metadata/metadata";
import { Collection, Volume, VolumeRead } from "../models/";
import { IGetUserAuthInfoRequest } from "../types/express";
import { VolumeModel } from "../models/volume.model";

let _metadata: Metadata;

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
	Collection.findAll({
		attributes: ["id", "name", "cover", [Sequelize.fn("COUNT", Sequelize.col("*")), "nbVolumes"], "createdAt", "updatedAt"],
		include: [
			{
				attributes: [],
				model: Volume,
			},
		],

		group: "collections.name",
		order: [["name", "asc"]],
	})
		.then((data) => {
			res.send(data);
		})
		.catch((err) => {
			res.send(err);
		});
};

export const getVolumesRead = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	const userId = req.user.id;
	const volumeHistory: VolumeModel[] = [];

	// Récupérer les collections commencer
	const collectionStarted = await Collection.findAll({
		attributes: ["id", "name"],
		include: [
			{
				attributes: [],
				model: VolumeRead,
				where: {
					userId: userId,
				},
			},
		],
		order: [["name", "asc"]],
	});

	for (const collection of collectionStarted) {
		// récupérer les volumes en cours de lecture ou pas commencé
		const volumes = await Volume.findAll({
			raw: true,
			attributes: [
				"id",
				"name",
				"cover",
				"nbPages",
				"createdAt",
				[Sequelize.col("volumeReads.isCompleted"), "isCompleted"],
				[Sequelize.col("volumeReads.currentPage"), "currentPage"],
			],
			include: [
				{
					attributes: [],
					model: VolumeRead,
					where: {
						userId: userId,
					},
					required: false,
				},
			],

			where: {
				collectionId: collection.id,
			},

			order: [["name", "asc"]],
		});

		let tmpVolume: VolumeModel;

		for (const volume of volumes) {
			if (!volume.isCompleted) {
				if (volume.currentPage) {
					tmpVolume = volume;
					break;
				}

				if (!volume.currentPage && !tmpVolume) {
					tmpVolume = volume;
				}
			}

			if (volume.isCompleted) {
				tmpVolume = null;
			}
		}
		if (tmpVolume) {
			tmpVolume.collectionName = collection.name;
			volumeHistory.push(tmpVolume);
		}
	}
	res.send(volumeHistory);
};

/**
 * * Retourne les volumes d'une collection
 * @params req.params.nameCollection nom de la collection à afficher
 */
export const getVolumes = (req: IGetUserAuthInfoRequest, res: Response): void => {
	Volume.findAll({
		attributes: [
			"id",
			"name",
			"nbPages",
			"cover",
			"createdAt",
			[Sequelize.col("volumereads.currentPage"), "currentPage"],
			[Sequelize.col("volumereads.isCompleted"), "isCompleted"],
		],
		include: [
			{
				attributes: [],
				model: Collection,
				where: {
					name: req.params.nameCollection,
				},
			},
			{
				attributes: [],
				model: VolumeRead,
				where: {
					userId: req.user.id,
				},
				required: false,
			},
		],
		order: [["name", "asc"]],
	})
		.then((data) => {
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
	} else {
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
