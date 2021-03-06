import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface VolumeReadAttributes {
	id?: number;
	userId: string;
	volumeId: number;
	collectionId: number;
	isCompleted?: boolean;
	currentPage: number;
	createdAt?: Date;
	updatedAt?: Date;
}
export interface VolumeReadModel extends Model<VolumeReadAttributes>, VolumeReadAttributes {}
export class VolumeRead extends Model<VolumeReadModel, VolumeReadAttributes> {}

export type VolumeReadStatic = typeof Model & {
	new (values?: Record<string, unknown>, options?: BuildOptions): VolumeReadModel;
};

export function VolumeReadFactory(sequelize: Sequelize): VolumeReadStatic {
	return <VolumeReadStatic>sequelize.define("volumeReads", {
		id: {
			type: DataTypes.INTEGER,
			autoIncrement: true,
			primaryKey: true,
		},
		userId: {
			type: DataTypes.UUID,
		},
		volumeId: {
			type: DataTypes.INTEGER,
		},
		collectionId: {
			type: DataTypes.INTEGER,
		},
		isCompleted: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		currentPage: {
			type: DataTypes.INTEGER,
		},
	});
}
