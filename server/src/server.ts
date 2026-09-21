import "dotenv/config";
import { buildApp } from "./app.js";

const app = await buildApp();

const port = Number(process.env.PORT ?? 5000);
const host = process.env.HOST ?? "0.0.0.0";

const start = async () => {
  try {
    await app.listen({
      port,
      host,
    });

    app.log.info(`Server running at http://${host}:${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

await start();
