import chokidar from "chokidar";
import Metadata from "./metadata";

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
     private tmpFile: string[] = [];

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
               usePolling: true,
               awaitWriteFinish: true,
               depth: 1
          });

          let initWatcher = true;
          
          logger.info("Début de l'initialisation");

          this.watcher
               .on("add", (path) => {

                    if (initWatcher) {
                         this.tmpFile.push(path);
                         this.metadata.Analyze(path, "check");
                    }
                    else {
                         this.metadata.Analyze(path, "add");
                    }

                    //metadata.addAnalyze(path);
               })
               .on("change", (path) => {
                    console.log("change");
                    this.metadata.Analyze(path, "check");
               })
               .on("unlink", (path) => {
                    //console.log("cc");
                    if (!initWatcher) {
                         this.metadata.Analyze(path, "delete");
                    }
               })
               .on("ready", () => {
                    logger.info("Fin de l'initialisation");
                    this.metadata.CleanVolume(this.tmpFile);
                    initWatcher = false;


               });
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


