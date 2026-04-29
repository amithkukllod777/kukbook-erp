import { Express, Request, Response } from "express";

interface SSEClient {
  id: string;
  companyId: number;
  res: Response;
}

const clients: SSEClient[] = [];

export function registerSSE(app: Express) {
  // SSE endpoint for real-time updates
  app.get("/api/sse/events", (req: Request, res: Response) => {
    const companyId = parseInt(req.query.companyId as string) || parseInt(req.headers["x-company-id"] as string) || 0;
    
    // Set SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: "connected", timestamp: Date.now() })}\n\n`);

    const clientId = `${companyId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const client: SSEClient = { id: clientId, companyId, res };
    clients.push(client);

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      res.write(`:ping\n\n`);
    }, 30000);

    // Remove client on disconnect
    req.on("close", () => {
      clearInterval(pingInterval);
      const idx = clients.findIndex((c) => c.id === clientId);
      if (idx !== -1) clients.splice(idx, 1);
    });
  });
}

// Broadcast event to all clients of a specific company
export function broadcastToCompany(companyId: number, event: { type: string; data: any }) {
  const companyClients = clients.filter((c) => c.companyId === companyId);
  const message = `data: ${JSON.stringify(event)}\n\n`;
  companyClients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // Client disconnected, will be cleaned up
    }
  });
}

// Broadcast to all connected clients
export function broadcastAll(event: { type: string; data: any }) {
  const message = `data: ${JSON.stringify(event)}\n\n`;
  clients.forEach((client) => {
    try {
      client.res.write(message);
    } catch {
      // Client disconnected
    }
  });
}
