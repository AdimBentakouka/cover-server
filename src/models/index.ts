import { Sequelize } from "sequelize";
import { CollectionFactory, CollectionStatic } from "./collection.model";
import { VolumeFactory, VolumeStatic } from "./volume.model";
import { UserFactory, UserStatic } from "./user.model";
import { SessionFactory, SessionStatic } from "./session.model";
import { VolumeReadFactory, VolumeReadStatic } from "./volumeread.model";

export interface DB {
	sequelize: Sequelize;
	Collection: CollectionStatic;
	Volume: VolumeStatic;
	User: UserStatic;
	Session: SessionStatic;
	VolumeRead: VolumeReadStatic;
}

const dbStorage = process.env.DB_STORAGE as string;

export const sequelize = new Sequelize({
	dialect: "sqlite",
	storage: dbStorage,

	retry: {
		match: [/SQLITE_BUSY/],
		max: 50,
	},

	pool: {
		min: 0,
		max: 5,
		idle: 10000,
	},

	benchmark: false,
	logging: false,
});

const _Collection = CollectionFactory(sequelize);
const _Volume = VolumeFactory(sequelize);
const _User = UserFactory(sequelize);
const _Session = SessionFactory(sequelize);
const _VolumeRead = VolumeReadFactory(sequelize);

_Collection.hasMany(_Volume);
_Volume.belongsTo(_Collection);

_User.hasMany(_Session);
_Session.belongsTo(_User);

_User.hasMany(_VolumeRead);
_Volume.hasMany(_VolumeRead);
_VolumeRead.belongsTo(_User);

export const Collection = _Collection;
export const Volume = _Volume;
export const User = _User;
export const Session = _Session;
export const VolumeRead = _VolumeRead;
