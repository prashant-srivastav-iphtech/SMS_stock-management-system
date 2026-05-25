import { DataTypes, Model } from "@sequelize/core";

import { sequelize } from "../config/database";

export class Store extends Model {
  declare id: string;
  declare organizationId: string;
  declare name: string;
  declare slug: string;
  declare isActive: boolean;
}

Store.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    organizationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "stores",
    timestamps: true,
  },
);
