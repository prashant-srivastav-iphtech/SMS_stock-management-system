import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";

export const sequelize = new Sequelize({
  dialect: PostgresDialect,

  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,

  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  logging: false,

  timezone: "+05:30",

  pool: {
    max: 20,
    min: 5,
    idle: 10000,
    acquire: 30000,
  },
});

export const syncDatabase = async () => {
  await sequelize.sync({ alter: true });

  console.log("Database synced successfully");
};