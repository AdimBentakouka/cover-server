import chokidar from "chokidar";
import Metadata from "./metadata/metadata";

import Logger from "./logger";

const logger = new Logger("Watcher");

/**
 * * Class qui écoute le dossier DIR_VOLUME et appele la génération des métadonneés
 *
 * @export
 * @class Watcher
 */
export default class Watcher {
	private metadata: Metadata;
	private watcher: chokidar.FSWatcher;

	constructor() {
		this.metadata = new Metadata();
		this.watcherTraitement();
	}

	/**
	 * * file de traitement
	 *
	 * @private
	 * @memberof Watcher
	 */
	private watcherTraitement(): void {
		this.watcher = chokidar.watch(process.env.DIR_VOLUME + "/", {
			usePolling: false,
			awaitWriteFinish: true,
			depth: 1,
		});

		let initWatcher = true;
		const fileWatcher: string[] = [];

		logger.info("Initilisation de tous les fichiers présents");

		this.watcher
			.on("add", (filepath) => {
				if (initWatcher) {
					fileWatcher.push(filepath);
				}
				this.traiter(filepath);
			})
			.on("change", (filepath) => {
				this.traiter(filepath, "add");
			})
			.on("unlink", (filepath) => {
				this.traiter(filepath, "remove");
			})
			.on("ready", () => {
				logger.info("Initilisation terminée !");
				initWatcher = false;

				this.metadata.cleanVolume(fileWatcher);
			});
	}

	// Check si l'extension est autorisée et fait le traitement du fichier
	private traiter(filepath: string, action: string = "add"): void {
		if (this.metadata.extIsSupported(filepath)) {
			this.metadata.analyze(filepath, action);
		}
	}

	/**
	 * Retourne la variable utilisé pour la génération des méta données
	 *
	 * @return {*}  {Metadata}
	 * @memberof Watcher
	 */
	public getMetadata(): Metadata {
		return this.metadata;
	}
}
