import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class MasterOrder extends Model {
  declare id: string;
  declare customerId: string;
  declare totalAmount: number;
  declare status: string;
}

MasterOrder.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "cancelled"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "master_orders",
    timestamps: true,
  },
);
