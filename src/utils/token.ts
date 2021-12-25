import * as jwt from "jsonwebtoken";
import { Request } from "express";

import crypto from "crypto";

import {Session, User} from "../models/";
import {JsonToken} from "../types/token";




// Génère un token access
export function generateToken(user: {id: string, email: string, name: string, isAdmin?: boolean}) : string
{
     let jsonToken: JsonToken = {
          id: user.id,
          email: user.email,
          username: user.name
     };

     if (user.isAdmin) {
          jsonToken = { ...jsonToken, isAdmin: user.isAdmin };
     }

     return jwt.sign(jsonToken, process.env.JWT_KEY_TOKEN, {
          expiresIn: process.env.JWT_EXPIRE_TOKEN
     });
}

//  Génére et stock un refreshToken
export function generateRefreshToken(userId: string, req: Request) : Promise<string>
{
     return new Promise<string>((resolve, reject) => {
          // Créer une clée unique
          const refreshToken = crypto.randomBytes(64).toString("hex");

          const browser = req.useragent?.browser || "unknown";
          const os = req.useragent?.os || "unknown";
          const date = new Date();
          // Enregistrer la clé en bdd avec l'id et les info du client

          Session.create({
               refreshToken: refreshToken,
               browser: browser,
               os: os,
               userId: userId,
               lastUsage: date
          })
          .then(() => {
               resolve(refreshToken);
          })
          .catch((err) => {
               console.log(err);
               reject({msg: "Session creation failed"});
          });

     });
     

     
}

// Générer un nouveau token à partir d'un refreshToken
export function generateNewToken(refreshToken: string) : Promise<string>
{
     return new Promise<string>((resolve, reject) => {
          Session.findOne({
               attributes: ["id", "lastUsage"],
               include: [{
                    attributes: ["name", "email", "isAdmin", "accountValid"],
                    model: User
               }],
               where : {
                    refreshToken: refreshToken
               }
     
          }).then((_session) => {

               if(_session)
               {
                    _session.lastUsage = new Date();
                    _session.save();

                    resolve(generateToken({
                         id: _session.user.id,
                         email: _session.user.email,
                         name: _session.user.name,
                         isAdmin: _session.user.isAdmin,
                    }));
               }
               else
               {
                    reject("session introuvable");
               }
         
          })
          .catch((err) => {
               console.log(err);
               reject(err);
          });
     });

}


