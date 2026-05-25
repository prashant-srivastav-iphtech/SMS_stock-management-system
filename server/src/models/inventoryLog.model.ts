import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class InventoryLog extends Model {
  declare id: string;
  declare productId: string;
  declare storeId: string;
  declare userId: string;
  declare change: number;
  declare reason: string;
}

InventoryLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    change: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "inventory_adjustment",
    },
  },
  {
    sequelize,
    tableName: "inventory_logs",
    timestamps: true,
  },
);
