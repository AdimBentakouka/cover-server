import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";

export interface UserAttributes {
     id?: string;
     name: string;
     email: string;
     password: string; 
     isAdmin?: boolean;
     accountValid?: Date;
     createdAt?: Date;
     updatedAt?: Date;
}


export interface UserModel extends Model<UserAttributes>, UserAttributes { }
export class User extends Model<UserModel, UserAttributes> { }

export type UserStatic = typeof Model & {
     new(values?: Record<string, unknown>, options?: BuildOptions): UserModel;
};

export function UserFactory(sequelize: Sequelize): UserStatic {
     return <UserStatic>sequelize.define("users", {
          id: {
               type: DataTypes.UUID,
               defaultValue: DataTypes.UUIDV4,
               allowNull: false,
               primaryKey: true
          },
          name: {
               type: DataTypes.STRING,
          },
          email: {
               type: DataTypes.STRING
          },
          password: {
               type: DataTypes.STRING
          },
          isAdmin: {
               type: DataTypes.BOOLEAN,
               defaultValue: false
          },
          accountValid: {
               type: DataTypes.DATE
          }
     });
}

