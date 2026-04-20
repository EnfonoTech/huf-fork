import { io, Socket } from "socket.io-client";

/**
 * Single app-wide socket.io connection. Frappe's socket.io server lives at
 * the same host as the HTTP app; credentials: "include" carries the session
 * cookie for auth. Reconnect is handled automatically.
 */

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (_socket) return _socket;
  const site = (window as unknown as { site_name?: string }).site_name ?? window.location.hostname;
  _socket = io(`${window.location.origin}`, {
    path: "/socket.io",
    withCredentials: true,
    autoConnect: true,
    query: { sid: document.cookie },
    auth: { sid: document.cookie, site_name: site },
    transports: ["websocket", "polling"],
  });
  return _socket;
}

export function disconnectSocket(): void {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}
