import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    define: {
        define: {
            // Use relative path '/api' so it works with both Vite Proxy (Dev) and Netlify Proxy (Prod)
            'import.meta.env.VITE_API_BASE': JSON.stringify('/api'),
            // Socket must connect directly to backend (not via proxy) to work reliably
            'import.meta.env.VITE_SOCKET_URL': JSON.stringify('https://ipl-auction-8a8o.onrender.com'),
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: 'http://localhost:5000',
                    changeOrigin: true,
                },
            },
        },
    }});
