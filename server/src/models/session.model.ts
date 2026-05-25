import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class Session extends Model {
  declare id: string;
  declare userId: string;
  declare refreshToken: string;
  declare hmacSecret: string;
  declare deviceFingerprint: string;
  declare ip: string;
  declare userAgent: string;
}

Session.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    hmacSecret: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    deviceFingerprint: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "sessions",
    timestamps: true,
  },
);
