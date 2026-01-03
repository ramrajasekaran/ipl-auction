import { io } from 'socket.io-client';

// Socket URL logic:
// - Production: MUST set VITE_SOCKET_URL to backend URL (e.g., https://your-backend.onrender.com)
// - Development: Falls back to localhost:5000
const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

console.log('[Socket] Connecting to:', URL);

export const socket = io(URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'], // Allow fallback to polling if websocket fails
    withCredentials: true
});
