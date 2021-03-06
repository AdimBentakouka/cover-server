import { Response } from "express";

import { Volume } from "../models/";
import { VolumeRead } from "../models/";
import { IGetUserAuthInfoRequest } from "../types/express";

import { getPage } from "../utils/reader/readerVolume";

/**
 * Permet de générer une page en image
 * @param req Request
 * @param res Response
 */
export const routeGetPage = (req: IGetUserAuthInfoRequest, res: Response): void => {
	const currentPage = parseInt(req.params.page);
	const user = req.user;

	Volume.findOne({
		where: {
			id: req.params.id,
		},
	})
		.then((volume) => {
			if (volume) {
				getPage(volume.filename, currentPage).then(async (data) => {
					VolumeRead.findOne({ where: { userId: user.id, volumeId: volume.id } })
						.then((volumeRead) => {
							const isCompleted = data.page === volume.nbPages ? true : false;
							if (volumeRead) {
								if (data.page !== 1) {
									volumeRead.currentPage = data.page;
									volumeRead.isCompleted = isCompleted;
									volumeRead.save();
								}
							} else {
								VolumeRead.create({
									userId: user.id,
									volumeId: volume.id,
									collectionId: volume.collectionId,
									currentPage: data.page,
									isCompleted,
								}).catch((err) => {
									console.log(err);
									return err;
								});
							}
						})
						.catch((err) => {
							console.log(err);
							return err;
						});
					res.set({ "Content-Type": "image/*" });
					res.send(data.buffer);
				});
			} else {
				res.status(404).send("Not found");
			}
		})
		.catch((err) => res.send(err));
};
