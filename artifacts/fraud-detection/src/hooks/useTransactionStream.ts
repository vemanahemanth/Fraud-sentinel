import { useEffect, useRef, useState, useCallback } from "react";

export type StreamTransaction = {
  id: string;
  merchantName: string;
  amount: number;
  currency: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  country: string;
  city: string;
  triggeredRules: string[];
  createdAt: string;
  _new?: boolean;
};

export type StreamAlert = {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  createdAt: string;
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

const MAX_ROWS = 50;

export function useTransactionStream() {
  const [transactions, setTransactions] = useState<StreamTransaction[]>([]);
  const [alerts, setAlerts] = useState<StreamAlert[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    let host = window.location.host;

    // Support production API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
      try {
        const urlObj = new URL(apiUrl);
        host = urlObj.host;
      } catch (e) {
        console.error("Invalid VITE_API_URL", e);
      }
    }

    const url = `${protocol}//${host}/api/ws`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setStatus("connecting");

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStatus("connected");
        if (reconnectRef.current) {
          clearTimeout(reconnectRef.current);
          reconnectRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(event.data as string);

          if (msg.type === "transaction") {
            const tx: StreamTransaction = { ...msg.data, _new: true };
            setTransactions((prev) => {
              const updated = [tx, ...prev].slice(0, MAX_ROWS);
              return updated;
            });
            setTimeout(() => {
              setTransactions((prev) =>
                prev.map((t) => (t.id === tx.id ? { ...t, _new: false } : t))
              );
            }, 1500);
          }

          if (msg.type === "alert") {
            const al: StreamAlert = { ...msg.data, createdAt: new Date().toISOString() };
            setAlerts((prev) => [al, ...prev].slice(0, 20));
          }
        } catch {
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus("disconnected");
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setStatus("error");
        ws.close();
      };
    } catch {
      setStatus("error");
      reconnectRef.current = setTimeout(connect, 5000);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { transactions, alerts, status };
}
