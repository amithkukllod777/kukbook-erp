import { useEffect, useRef, useCallback } from "react";

type SSEEvent = {
  type: string;
  data: any;
};

type SSEHandler = (event: SSEEvent) => void;

export function useSSE(onEvent?: SSEHandler) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Set<SSEHandler>>(new Set());

  useEffect(() => {
    if (onEvent) {
      handlersRef.current.add(onEvent);
    }
    return () => {
      if (onEvent) {
        handlersRef.current.delete(onEvent);
      }
    };
  }, [onEvent]);

  useEffect(() => {
    const companyId = localStorage.getItem("kukbook_active_company") || "0";
    
    const connect = () => {
      const es = new EventSource(`/api/sse/events?companyId=${companyId}`);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const parsed: SSEEvent = JSON.parse(event.data);
          handlersRef.current.forEach((handler) => handler(parsed));
        } catch {
          // Ignore parse errors
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const subscribe = useCallback((handler: SSEHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return { subscribe };
}
