import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface CollectionAttributes {
	id?: number;
	name: string;
	cover?: string;
	createdAt?: Date;
	updatedAt?: Date;
	volumes?: [];
}
export interface CollectionModel extends Model<CollectionAttributes>, CollectionAttributes {}
export class Collection extends Model<CollectionModel, CollectionAttributes> {}

export type CollectionStatic = typeof Model & {
	new (values?: Record<string, unknown>, options?: BuildOptions): CollectionModel;
};

export function CollectionFactory(sequelize: Sequelize): CollectionStatic {
	return <CollectionStatic>sequelize.define("collections", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		cover: {
			type: DataTypes.STRING,
		},
		createdAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
		updatedAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	});
}
