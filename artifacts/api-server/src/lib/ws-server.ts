import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { logger } from "./logger";

let wss: WebSocketServer | null = null;

export function createWsServer(server: Server): WebSocketServer {
  wss = new WebSocketServer({ server, path: "/api/ws" });

  wss.on("connection", (ws) => {
    logger.info("WebSocket client connected");

    ws.on("close", () => {
      logger.info("WebSocket client disconnected");
    });

    ws.on("error", (err) => {
      logger.warn({ err }, "WebSocket client error");
    });

    ws.send(JSON.stringify({ type: "connected", message: "Aegis stream active" }));
  });

  logger.info("WebSocket server initialized at /api/ws");
  return wss;
}

export function broadcast(payload: object): void {
  if (!wss) return;
  const data = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}
