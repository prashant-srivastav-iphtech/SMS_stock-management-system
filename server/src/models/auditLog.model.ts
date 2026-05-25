import { DataTypes, Model } from "@sequelize/core";
import { sequelize } from "../config/database";

export class AuditLog extends Model {
  declare id: string;
  declare userId: string | null;
  declare eventType: string;
  declare targetType: string;
  declare targetId: string | null;
  declare data: string;
}

AuditLog.init(
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
    eventType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    timestamps: true,
  },
);
