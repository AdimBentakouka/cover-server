import { BuildOptions, DataTypes, Model, Sequelize } from "sequelize";
import {UserAttributes} from "./user.model";

export interface SessionAttributes {
     id?: string;
     refreshToken: string;
     browser: string;
     os: string;
     lastUsage: Date;
     userId: string;
     user?: UserAttributes;
}


export interface SessionModel extends Model<SessionAttributes>, SessionAttributes { }
export class Session extends Model<SessionModel, SessionAttributes> { }

export type SessionStatic = typeof Model & {
     new(values?: Record<string, unknown>, options?: BuildOptions): SessionModel;
};

export function SessionFactory(sequelize: Sequelize): SessionStatic {
     return <SessionStatic>sequelize.define("sessions", {
          id: {
               type: DataTypes.UUID,
               defaultValue: DataTypes.UUIDV4,
               allowNull: false,
               primaryKey: true
          },
          refreshToken: {
               type: DataTypes.STRING
          },
          browser: {
               type: DataTypes.STRING,
          },
          os: {
               type: DataTypes.STRING,
          },
          lastUsage: {
               type: DataTypes.DATE
          }
     });
}

