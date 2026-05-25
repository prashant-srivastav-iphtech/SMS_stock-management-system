import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class RequestNonce extends Model {
  declare nonce: string;
  declare expiresAt: Date;
}

RequestNonce.init(
  {
    nonce: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "request_nonces",
    timestamps: true,
  },
);
