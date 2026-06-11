import { io, type Socket } from "socket.io-client";

/**
 * Singleton Socket.io client untuk update real-time (dashboard produksi, FR-02).
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true, transports: ["websocket", "polling"] });
  }
  return socket;
}
