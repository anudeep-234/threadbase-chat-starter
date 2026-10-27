import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../auth/AuthContext.jsx";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

export function useSocket(roomId) {
  const { token } = useAuth();
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !roomId) return;

    setMessages([]); // clear the previous room's messages

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    const onMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    // Join on every connect, so reconnects rejoin the room.
    socket.on("connect", () => {
      socket.emit("room:join", roomId);
    });
    socket.on("chat:message", onMessage);

    return () => {
      socket.off("chat:message", onMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, roomId]);

  const sendMessage = useCallback(
    (text) => {
      socketRef.current?.emit("chat:message", { roomId, text });
    },
    [roomId]
  );

  return { messages, sendMessage };
}