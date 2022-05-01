import { Request, Response } from "express";
import { Sequelize } from "sequelize";
import fs from "fs";
import ip from "ip";

import Metadata from "../utils/metadata/metadata";
import { Collection, Volume, VolumeRead } from "../models/";
import { IGetUserAuthInfoRequest } from "../types/express";
import { VolumeModel } from "../models/volume.model";

const PORT = process.env.PORT || 3000;

const PATH_COVER = "http://" + ip.address() + ":" + PORT + "/metadata/getcover/";

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
export const getCollections = (req: IGetUserAuthInfoRequest, res: Response): void => {
	Collection.findAll({
		attributes: ["id", "name", [Sequelize.literal("'" + PATH_COVER + "' || collections.cover"), "cover"], "createdAt", "updatedAt"],
		include: [
			{
				attributes: ["id"],
				model: Volume,
				separate: true,
				required: true,
			},
			{
				attributes: ["id"],
				model: VolumeRead,
				separate: true,
				where: {
					userId: req.user.id,
					isCompleted: 1,
				},
				required: false,
			},
		],

		order: [["name", "asc"]],
	})
		.then((data) => {
			const result: {
				id?: number;
				name: string;
				cover?: string;
				createdAt?: Date;
				updatedAt?: Date;
				nbVolumes?: number;
				nbVolumesRead?: number;
			}[] = [];
			data.map((collection) => {
				const { volumes, volumeReads, id, name, cover, createdAt, updatedAt } = collection.get({ plain: true });
				const nbVolumes = volumes?.length || 0;
				const nbVolumesRead = volumeReads?.length || 0;

				result.push({ id, name, cover, nbVolumes, nbVolumesRead, createdAt, updatedAt });
			});

			res.send(result);
		})
		.catch((err) => {
			console.log(err);
			res.status(400).send(err);
		});
};

export const getVolumesRead = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	const userId = req.user.id || null;
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
				[Sequelize.literal("'" + PATH_COVER + "' || cover"), "cover"],
				"nbPages",
				[Sequelize.col("volumeReads.isCompleted"), "isCompleted"],
				[Sequelize.col("volumeReads.currentPage"), "currentPage"],
				"createdAt",
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
			[Sequelize.literal("'" + PATH_COVER + "' || volumes.cover"), "cover"],
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

export const getSearchCollection = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	try {
		const collections = await Collection.findAll({
			attributes: [
				"name",
				[Sequelize.literal("'" + PATH_COVER + "' || collections.cover"), "cover"],
				[Sequelize.literal("count(*) || ' volumes'"), "desc"],
			],
			include: [
				{
					attributes: [],
					model: Volume,
				},
			],

			group: "collections.name",
			order: [["name", "asc"]],
		});

		res.send(collections);
	} catch (e) {
		res.send(e);
	}
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

export const setReadVolume = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	const volumeId = parseInt(req.params.id);
	const user = req.user;

	try {
		const volumeRead = await VolumeRead.findOne({ where: { userId: user.id, volumeId: volumeId } });
		const volume = await Volume.findOne({ where: { id: volumeId } });

		if (volumeRead) {
			volumeRead.isCompleted = true;
			volumeRead.currentPage = volume.nbPages;

			volumeRead.save();
			res.send("done");
		} else {
			VolumeRead.create({
				userId: user.id,
				volumeId: volume.id,
				collectionId: volume.collectionId,
				currentPage: volume.nbPages,
				isCompleted: true,
			});

			res.send("done");
		}
	} catch (e) {
		console.error(e);
		res.status(400).send(e);
	}
};

export const setUnreadVolume = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	const volumeId = parseInt(req.params.id);
	const user = req.user;

	try {
		const volumeRead = await VolumeRead.findOne({ where: { userId: user.id, volumeId: volumeId } });

		volumeRead.destroy();

		res.send("done");
	} catch (e) {
		res.status(400).send(e);
	}
};

export const setCollectionRead = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	const collectionId = parseInt(req.params.id);
	const user = req.user;

	try {
		const volumes = await Volume.findAll({ where: { collectionId: collectionId } });
		const createVolumesRead: { userId: string; volumeId: number; collectionId: number; currentPage: number; isCompleted: boolean }[] =
			[];

		for (const volume of volumes) {
			const volumeRead = await VolumeRead.findOne({ where: { volumeId: volume.id, userId: user.id } });

			if (volumeRead && !volumeRead.isCompleted) {
				volumeRead.currentPage = volume.nbPages;
				volumeRead.isCompleted = true;

				volumeRead.save();
			}
			if (!volumeRead) {
				createVolumesRead.push({
					userId: user.id,
					volumeId: volume.id,
					collectionId: volume.collectionId,
					currentPage: volume.nbPages,
					isCompleted: true,
				});
			}
		}
		await VolumeRead.bulkCreate(createVolumesRead);
		res.send("done");
	} catch (e) {
		res.status(400).send(e);
	}
};

export const setCollectionUnRead = async (req: IGetUserAuthInfoRequest, res: Response): Promise<void> => {
	const collectionId = parseInt(req.params.id);
	const user = req.user;

	try {
		VolumeRead.destroy({ where: { collectionId: collectionId, userId: user.id } });

		res.send("done");
	} catch (e) {
		res.status(400).send(e);
	}
};
