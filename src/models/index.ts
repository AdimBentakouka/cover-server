import { Sequelize } from "sequelize";
import { VolumeFactory, VolumeStatic } from "./volume.model";
import { UserFactory, UserStatic } from "./user.model";
import { SessionFactory, SessionStatic } from "./session.model";


export interface DB {
     sequelize: Sequelize;
     Volume: VolumeStatic;
     User: UserStatic;
     Session: SessionStatic;

}

const dbStorage = process.env.DB_STORAGE as string;

export const sequelize = new Sequelize({
     dialect: "sqlite",
     storage: dbStorage,

     retry: {
          match: [
               /SQLITE_BUSY/,
          ],
          max: 50
     },

     pool: {
          min: 0,
          max: 5,
          idle: 10000
     },

     benchmark: false,
     logging: false
});

const _Volume = VolumeFactory(sequelize);
const _User = UserFactory(sequelize);
const _Session = SessionFactory(sequelize);

_User.hasMany(_Session);
_Session.belongsTo(_User);

export const Volume = _Volume;
export const User = _User;
export const Session = _Session;

