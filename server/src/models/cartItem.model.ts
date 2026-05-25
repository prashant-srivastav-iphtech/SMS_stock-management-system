import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class CartItem extends Model {
  declare id: string;
  declare cartId: string;
  declare productId: string;
  declare storeId: string;
  declare quantity: number;
}

CartItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cartId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    tableName: "cart_items",
    timestamps: true,
  },
);
