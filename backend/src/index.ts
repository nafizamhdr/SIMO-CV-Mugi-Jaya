import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import { Server as SocketServer } from "socket.io";
import routes from "./routes";
import { UPLOAD_DIR } from "./middleware/upload.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { connectRedis } from "./lib/redis";
import { logger } from "./lib/logger";

const app = express();
const server = http.createServer(app);

// FRONTEND_URL mendukung banyak origin dipisah koma
// (mis. domain produksi Vercel + preview + localhost dev).
const allowedOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Static: foto dokumentasi produksi/QC (dev — nantinya AWS S3)
app.use("/uploads", express.static(UPLOAD_DIR));

// API routes
app.use("/api", routes);

// Socket.io — real-time dashboard updates (Modul Produksi & Logistik)
const io = new SocketServer(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.on("connection", (socket) => {
  logger.info(`Socket terhubung: ${socket.id}`);
  socket.on("disconnect", () => logger.info(`Socket terputus: ${socket.id}`));
});

// Expose io for controllers (set after creation).
app.set("io", io);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap(): Promise<void> {
  await connectRedis();
  server.listen(PORT, () => {
    logger.info(`SIMO backend berjalan di http://localhost:${PORT}`);
    logger.info(`Health check: http://localhost:${PORT}/api/health`);
  });
}

bootstrap().catch((error) => {
  logger.error("Gagal memulai server", error);
  process.exit(1);
});

export { app, io };
