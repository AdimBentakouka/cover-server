import path from "path";
import fs from "fs";
import StreamZip from "node-stream-zip";
import sharp from "sharp";
import { createExtractorFromData, Extractor } from "node-unrar-js";

import { Reader } from "./";

sharp.cache(false);

/**
 *Retourne le nombre de page d'un volume de type CBZ
 *
 * @param {string} filepath chemin du fichier a récupérer
 * @return {*}  {(Promise<number>)} soit un nombre soit une erreur
 */
function countPageCBZ(filepath: string): Promise<number> {
	return new Promise<number>((resolve, reject) => {
		const volume = new StreamZip({
			file: filepath,
			storeEntries: true,
		});

		volume.on("ready", async () => {
			let pages = Object.values(volume.entries());

			//retire les fichiers qui ne sont pas des images
			pages = pages.filter((__page) => __page.name.includes(".jpg") || __page.name.includes(".jpeg") || __page.name.includes(".png"));

			volume.close();

			resolve(pages.length);
		});

		volume.on("error", (err) => {
			reject(err.toString());
		});
	});
}

/**
 *Retourne le nombre de page d'un volume de type CBR
 *
 * @param {string} filepath chemin du fichier a récupérer
 * @return {*}  {(Promise<number | string>)} soit un nombre soit une erreur
 */
function countPageCBR(filepath: string): Promise<number> {
	return new Promise<number>(async (resolve, reject) => {
		fs.access(filepath, fs.constants.F_OK, (err) => {
			if (err) {
				reject(err.toString());
			} else {
				//file exists
				// ouvrir le cbr et bufferiser
				const volume = Uint8Array.from(fs.readFileSync(filepath)).buffer;

				createExtractorFromData({
					data: volume,
				})
					.then((extractor: Extractor<Uint8Array>) => {
						// récupère les infos de toutes les pages
						const list = extractor.getFileList();

						// charges tous les headers
						let fileHeaders = [...list.fileHeaders]; // load the file headers

						fileHeaders = fileHeaders.filter((__page) => __page.flags.directory == false);

						resolve(fileHeaders.length);
					})
					.catch((err: string) => {
						reject(err.toString());
					});
			}
		});
	});
}

/**
 * Retourne le buffer de l'image type CBZ
 *
 * @param {string} filepath chemin de fichier
 * @param {number} indexPage numéro de page
 * @return {*}  {(Promise<Buffer | string>)}
 */
function getPageCBZ(filepath: string, indexPage: number): Promise<Reader> {
	return new Promise<Reader>(async (resolve, reject) => {
		const volume = new StreamZip({
			file: filepath,
			storeEntries: true,
		});

		volume.on("ready", async () => {
			let pages = Object.values(volume.entries());

			//retire les fichiers qui ne sont pas des images
			pages = pages.filter((__page) => __page.name.includes(".jpg") || __page.name.includes(".jpeg") || __page.name.includes(".png"));

			// controle sur les pages a obtenir
			if (indexPage < 0) {
				indexPage = 0;
			}
			if (indexPage >= pages.length) {
				indexPage = pages.length - 1;
			}

			pages = pages.sort((a, b): number => {
				if (a.name < b.name) {
					return -1;
				}
				if (a.name > b.name) {
					return 1;
				}

				return 0;
			});

			const _page = await volume.entryDataSync(pages[indexPage]?.name);

			volume.close();

			resolve({ buffer: _page, page: indexPage + 1 });
		});

		volume.on("error", (err) => {
			reject(err.toString());
		});
	});
}

/**
 * Retourne le buffer de l'image type CBZ
 *
 * @param {string} filepath chemin de fichier
 * @param {number} indexPage numéro de page
 * @return {*}  {(Promise<Buffer | string>)}
 */

function getPageCBR(filepath: string, indexPage: number): Promise<Reader> {
	return new Promise<Reader>(async (resolve, reject) => {
		fs.access(filepath, fs.constants.F_OK, (err) => {
			if (err) {
				reject(err.toString());
			} else {
				//file exists
				// ouvrir le cbr et bufferiser
				const volume = Uint8Array.from(fs.readFileSync(filepath)).buffer;

				createExtractorFromData({
					data: volume,
				})
					.then(async (extractor: Extractor<Uint8Array>) => {
						// récupère les infos de toutes les pages
						const list = extractor.getFileList();

						// charges tous les headers
						let fileHeaders = [...list.fileHeaders]; // load the file headers

						fileHeaders = fileHeaders.filter((__page) => __page.flags.directory == false);

						if (indexPage < 0) {
							indexPage = 0;
						}
						if (indexPage >= fileHeaders.length) {
							indexPage = fileHeaders.length - 1;
						}

						fileHeaders.sort((a, b): number => {
							if (a.name < b.name) {
								return -1;
							}
							if (a.name > b.name) {
								return 1;
							}

							return 0;
						});

						// extraire la page souhaité
						const extracted = extractor.extract({
							files: [fileHeaders[indexPage]?.name],
						});

						const files = [...extracted.files]; //load the files

						resolve({ buffer: await sharp(files[0].extraction).toBuffer(), page: indexPage + 1 });
					})
					.catch((err: string) => {
						reject(err.toString());
					});
			}
		});
	});
}

/**
 *
 * * compte le nombre de page sur un volume
 * @export
 * @param {string} filepath
 * @return {*}  {(Promise<number | string>)}
 */
export async function countPage(filepath: string): Promise<number> {
	return new Promise<number>(async (resolve, reject) => {
		const ext = path.extname(filepath);

		switch (ext) {
			case ".zip":
			case ".cbz":
				countPageCBZ(filepath)
					.then((nbPage: number) => {
						resolve(nbPage);
					})
					.catch((err: string) => {
						reject(err);
					});

				break;
			case ".rar":
			case ".cbr":
				countPageCBR(filepath)
					.then((nbPage: number) => {
						resolve(nbPage);
					})
					.catch((err: string) => {
						reject(err);
					});
				break;
			default:
				reject("l'extensions n'est pas pris en charge");
		}
	});
}

/**
 * * Permet d'obtenir une image de la page du volume souhaité
 *
 * @export
 * @param {string} filepath chemin du fichier à récupérer
 * @param {number} [page=1] page à afficher
 * @return {*}  {(Promise<Buffer | string>)}
 */
export async function getPage(filepath: string, page: number = 1): Promise<Reader> {
	return new Promise<Reader>(async (resolve, reject) => {
		const ext = path.extname(filepath);

		switch (ext) {
			case ".zip":
			case ".cbz":
				getPageCBZ(filepath, page - 1)
					.then((data: Reader) => {
						resolve(data);
					})
					.catch((err: string) => {
						reject(err);
					});

				break;
			case ".rar":
			case ".cbr":
				getPageCBR(filepath, page - 1)
					.then((data: Reader) => {
						resolve(data);
					})
					.catch((err: string) => {
						reject(err);
					});
				break;
			default:
				reject("l'extensions n'est pas pris en charge");
		}
	});
}
