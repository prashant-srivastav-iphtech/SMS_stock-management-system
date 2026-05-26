import dotenv from "dotenv";
dotenv.config();
import { app } from "./app";
import { syncDatabase } from "./config/database";
import { env } from "./utils/envValidator";

const PORT = Number(env.PORT ?? 5000);

const start = async () => {
  await syncDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

start();
