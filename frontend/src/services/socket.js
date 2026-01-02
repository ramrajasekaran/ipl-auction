import { io } from 'socket.io-client';

// Use dedicated Socket URL if available, otherwise fallback to API Base or localhost
const URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket']
});
