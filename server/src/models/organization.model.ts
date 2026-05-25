import { DataTypes, Model } from "@sequelize/core";

import { sequelize } from "../config/database";

export class Organization extends Model {
  declare id: string;
  declare name: string;
  declare slug: string;
  declare isActive: boolean;
}

Organization.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    tableName: "organizations",
    timestamps: true,
  },
);
