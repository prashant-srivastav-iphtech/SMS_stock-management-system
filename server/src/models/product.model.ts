import { DataTypes, Model } from "@sequelize/core";

import { sequelize } from "../config/database";

export class Product extends Model {
  declare id: string;
  declare storeId: string;
  declare categoryId: string | null;
  declare sku: string;
  declare name: string;
  declare description: string | null;
  declare price: number;
  declare stock: number;
  declare reservedStock: number;
  declare soldStock: number;
  declare returnedStock: number;
  declare damagedStock: number;
  declare status: "draft" | "active" | "inactive" | "out_of_stock";
}

Product.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    storeId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    reservedStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    soldStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    returnedStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    damagedStock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("draft", "active", "inactive", "out_of_stock"),
      defaultValue: "draft",
    },
  },
  {
    sequelize,
    tableName: "products",
    timestamps: true,
  },
);
