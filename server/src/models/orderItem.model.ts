import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";
import type { Product } from "./product.model";

export class OrderItem extends Model {
  declare id: string;
  declare orderId: string;
  declare productId: string;
  declare quantity: number;
  declare price: number;
  declare product?: Product;
}

OrderItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "order_items",
    timestamps: true,
  },
);
