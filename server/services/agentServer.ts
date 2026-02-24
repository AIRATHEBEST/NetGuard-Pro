/**
 * Agent WebSocket Server
 * Merged from NetGuard-Pro-v2-SaaS-Ready
 * Receives real-time data from network agents
 */
import { WebSocketServer, WebSocket } from "ws";
import { ENV } from "../_core/env";

interface AgentMessage {
  status: string;
  timestamp: number;
  deviceMac?: string;
  networkId?: string;
  data?: Record<string, unknown>;
}

let wss: WebSocketServer | null = null;
const connectedAgents = new Map<string, WebSocket>();

export function startAgentServer(): void {
  const port = ENV.agentWsPort;

  if (wss) {
    console.log("[AgentServer] Already running");
    return;
  }

  wss = new WebSocketServer({ port });

  wss.on("listening", () => {
    console.log(`[AgentServer] WebSocket server listening on port ${port}`);
  });

  wss.on("connection", (ws, req) => {
    const agentId = crypto.randomUUID();
    connectedAgents.set(agentId, ws);
    console.log(`[AgentServer] Agent connected: ${agentId} from ${req.socket.remoteAddress}`);

    ws.on("message", (msg) => {
      try {
        const data: AgentMessage = JSON.parse(msg.toString());
        console.log(`[AgentServer] Data from agent ${agentId}:`, data.status, data.timestamp);
        handleAgentMessage(agentId, data);
      } catch (err) {
        console.error("[AgentServer] Failed to parse message:", err);
      }
    });

    ws.on("close", () => {
      connectedAgents.delete(agentId);
      console.log(`[AgentServer] Agent disconnected: ${agentId}`);
    });

    ws.on("error", (err) => {
      console.error(`[AgentServer] Error from agent ${agentId}:`, err.message);
    });

    // Send acknowledgment
    ws.send(JSON.stringify({ type: "connected", agentId, timestamp: Date.now() }));
  });

  wss.on("error", (err) => {
    console.error("[AgentServer] Server error:", err.message);
  });
}

function handleAgentMessage(agentId: string, data: AgentMessage): void {
  // Process agent data - can be extended to store in Supabase
  if (data.status === "scan") {
    console.log(`[AgentServer] Scan data received from agent ${agentId}`);
  }
}

export function getConnectedAgentCount(): number {
  return connectedAgents.size;
}

export function broadcastToAgents(message: object): void {
  const payload = JSON.stringify(message);
  connectedAgents.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

export function stopAgentServer(): void {
  if (wss) {
    wss.close();
    wss = null;
    connectedAgents.clear();
    console.log("[AgentServer] Stopped");
  }
}
