import app from "./app.js";
import { validateEnvironment } from "./config/env.js";

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

try {
  validateEnvironment();

  const port = Number(process.env.PORT ?? 3000);

  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error("PORT harus berupa bilangan bulat antara 1 dan 65535");
  }

  app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
  });
} catch (error) {
  console.error("Gagal menjalankan server:", error);
  process.exit(1);
}
