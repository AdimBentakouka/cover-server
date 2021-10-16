import * as fs from "fs";
import * as path from "path";

enum ColorLevel {
     Reset = "\x1b[0m",
     Default = "\x1b[37m",
     Info = "\x1b[36m",
     Warn = "\x1b[33m",
     Error = "\x1b[31m",
     Debug = "\x1b[35m",

}

export type configLogger =
     {
          filepath: string,
          showLevel: string[]
     }

export default class Logger {

     private name: string;

     private config: configLogger = {
          filepath: "./logs/",
          showLevel: ["Info", "Warn", "Error", "Debug"]
     }

     constructor(name: string = "App", config?: configLogger) {
          this.name = name;

          if(config)
          {
               this.config = config;
          }

     }

     /**
      * Récupère la date sous la forme YYYY-MM-DD HH:MM
      */
     private getDate(): string {
          const date = new Date();

          return date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + date.getDate()).slice(-2) + " "
               + ("0" + date.getHours()).slice(-2) + ":" + ("0" + date.getMinutes()).slice(-2) + ":"+ ("0" + date.getSeconds()).slice(-2);

     }



     /**
      * * Affiche et enregistre un fichier .log
      *
      * @private
      * @param {string} [level="Info"] - Niveau du log 
      * @param {string} colorLevel - Color du log
      * @param {string} msg - message à afficher
      * @memberof Logger
      */
     private ConsoleLog(level: string = "Info", colorLevel: string, msg: string): void {
          
          const _date = this.getDate();
  
          const msgLog = `${colorLevel} ${_date} [${this.name}] - ${level}: ${ColorLevel.Default}${msg}`;
          const msgWrite = `${_date} [${this.name}] - ${level}: ${msg}`;

          if (this.config.showLevel.includes(level)) {
               console.log(msgLog);

               if(this.config.filepath)
               {
                    const filepath = `${this.config.filepath}/${this.name}/${_date.substring(0,10)}.${level}.log`;
     
                    fs.mkdir(path.dirname(filepath),{recursive: true}, (err) => 
                    {
                        if(err) throw err;
                
                        fs.writeFile(filepath, msgWrite+"\r\n", {flag: "a+"}, (err) => {
                            if(err) throw err;
                        });
                    });
               }
          }
     }


     public info(msg: string): void {
          this.ConsoleLog("Info", ColorLevel.Info, msg);
     }

     public debug(msg: string): void {
          this.ConsoleLog("Debug", ColorLevel.Debug, msg);
     }

     public error(msg: string): void {
          this.ConsoleLog("Error", ColorLevel.Error, msg);
     }

     public warn(msg: string): void {
          this.ConsoleLog("Warn", ColorLevel.Warn, msg);
     }


}