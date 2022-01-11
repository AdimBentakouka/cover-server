import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface VolumeAttributes {
	id?: number;
	name: string;
	collectionId: number;
	collectionName?: string;
	filename: string;
	nbPages: number;
	cover: string;
	sizefile: number;
	isCompleted?: string;
	currentPage?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
export interface VolumeModel extends Model<VolumeAttributes>, VolumeAttributes {}
export class Volume extends Model<VolumeModel, VolumeAttributes> {}

export type VolumeStatic = typeof Model & {
	new (values?: Record<string, unknown>, options?: BuildOptions): VolumeModel;
};

export function VolumeFactory(sequelize: Sequelize): VolumeStatic {
	return <VolumeStatic>sequelize.define("volumes", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
		},
		filename: {
			type: DataTypes.STRING,
		},
		nbPages: {
			type: DataTypes.INTEGER,
		},
		cover: {
			type: DataTypes.STRING,
		},
		sizefile: {
			type: DataTypes.INTEGER,
		},
		collectionId: {
			type: DataTypes.INTEGER,
		},
	});
}
