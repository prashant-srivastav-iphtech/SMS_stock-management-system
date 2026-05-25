import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class Category extends Model {
  declare id: string;
  declare name: string;
  declare organizationId: string;
}

Category.init(
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
  },
  {
    sequelize,
    tableName: "categories",
    timestamps: true,
  },
);
