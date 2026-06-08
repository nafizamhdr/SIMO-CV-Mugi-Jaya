import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import { Server as SocketServer } from "socket.io";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { connectRedis } from "./lib/redis";
import { logger } from "./lib/logger";

const app = express();
const server = http.createServer(app);

const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

app.use(cors({ origin: frontendUrl, credentials: true }));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// Socket.io — real-time dashboard updates (Modul Produksi & Logistik)
const io = new SocketServer(server, {
  cors: { origin: frontendUrl, credentials: true },
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
