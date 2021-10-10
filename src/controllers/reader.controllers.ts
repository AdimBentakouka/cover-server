import { Request, Response } from "express";

import { Volume } from "../models/";

import { getPage } from "../utils/readerVolume";


/**
 * Permet de générer une page en image
 * @param req Request
 * @param res Response
 */
export const routeGetPage = (req: Request, res: Response): void => {

     Volume.findOne({
          where: {
               id: req.params.id
          }
     }).then((volume) => {

          getPage(volume.filename, parseInt(req.params.page))
               .then(async (data) => {
                    res.set({ "Content-Type": "image/*" });
                    res.send(data);
               });
     }).catch((err) => res.send(err));
};


