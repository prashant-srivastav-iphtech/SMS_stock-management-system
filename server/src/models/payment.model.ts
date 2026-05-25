import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class Payment extends Model {
  declare id: string;
  declare masterOrderId: string;
  declare userId: string;
  declare stripePaymentIntentId: string;
  declare amount: number;
  declare status: string;
}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    masterOrderId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "successful", "failed", "refunded"),
      defaultValue: "pending",
    },
  },
  {
    sequelize,
    tableName: "payments",
    timestamps: true,
  },
);
