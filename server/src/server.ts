import dotenv from "dotenv";

dotenv.config();

import { app } from "./app";
import { syncDatabase } from "./config/database";

const PORT = Number(process.env.PORT || 5000);

const start = async () => {
  await syncDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
  });
};

start();
