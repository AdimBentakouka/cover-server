import chokidar from "chokidar";
import Metadata from "./metadata/metadata";

import Logger from "../helpers/logger";

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
               depth: 1
          });

          let initWatcher = true;
          const fileWatcher: string[] = [];

          logger.info("Initilisation de tous les fichiers présents");

          this.watcher
               .on("add", (path) => {
                    if (initWatcher) {
                         fileWatcher.push(path);
                    }
                    this.traiter(path);
               })
               .on("change", (path) => {
                    this.traiter(path, "add");
               })
               .on("unlink", (path) => {
                    this.traiter(path, "delete");
               })
               .on("ready", () => {
                    logger.info("Initilisation terminée !");
                    initWatcher = false;

                    this.metadata.cleanVolume(fileWatcher);
               });

     }


     // Check si l'extension est autorisée et fait le traitement du fichier
     private traiter(path: string, action: string = "add"): void {
          if (this.metadata.extIsAllowed(path)) {
               this.metadata.Analyse(path, action);
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


