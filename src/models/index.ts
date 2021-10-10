import {Sequelize} from "sequelize";
import {CollectionFactory, CollectionStatic} from "./collection.model";
import {VolumeFactory, VolumeStatic} from "./volume.model";

export interface DB {
     sequelize: Sequelize;
     Collection: CollectionStatic;
     Volume: VolumeStatic;

}

const dbStorage = process.env.DB_STORAGE as string;

export const sequelize = new Sequelize({
     dialect: "sqlite",
     storage: dbStorage,

     pool: {
          min: 0,
          max: 5,
          idle: 10000
      },
   
      benchmark: false,
      logging: false
});

const _Collection = CollectionFactory(sequelize);
const _Volume = VolumeFactory(sequelize);

_Collection.hasMany(_Volume);
_Volume.belongsTo(_Collection);


export const Collection = _Collection;
export const Volume = _Volume;
