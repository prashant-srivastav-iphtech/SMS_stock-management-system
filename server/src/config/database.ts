import { Sequelize } from "@sequelize/core";
import { PostgresDialect } from "@sequelize/postgres";
import { env } from "../utils/envValidator";

export const sequelize = new Sequelize({
  dialect: PostgresDialect,

  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASS,

  host: env.DB_HOST,
  port: Number(env.DB_PORT ?? 5432),

  logging: false,

  timezone: "+05:30",

  pool: {
    max: 20,
    min: 5,
    idle: 10000,
    acquire: 30000,
  },
});

// for development only
export const syncDatabase = async () => {
  if (env.NODE_ENV === "development") {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully");
  }
};
