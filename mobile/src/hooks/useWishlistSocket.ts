import { getApiBaseUrl } from "@/api/client";
import { WSMessage } from "@/api/types";
import { useEffect, useRef, useState } from "react";

export const useWishlistSocket = (
  wishlistId: number | null,
  onMessage: (message: WSMessage) => void
) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!wishlistId) return;
    let active = true;

    const connect = () => {
      if (!active) return;
      const base = getApiBaseUrl().replace(/^http/, "ws");
      const wsUrl = `${base}/api/items/ws/${wishlistId}`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WSMessage;
          onMessageRef.current(parsed);
        } catch {
          // ignore invalid message
        }
      };
      socket.onerror = () => setConnected(false);
      socket.onclose = () => {
        setConnected(false);
        if (!active) return;
        reconnectRef.current = setTimeout(connect, 2500);
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [wishlistId]);

  return { connected };
};
