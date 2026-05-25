import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class Cart extends Model {
  declare id: string;
  declare userId: string | null;
}

Cart.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "carts",
    timestamps: true,
  },
);
