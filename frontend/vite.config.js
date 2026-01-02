import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    define: {
        // ⚠️ REPLACE THIS WITH YOUR HOSTED BACKEND URL
        'import.meta.env.VITE_API_BASE': JSON.stringify('https://ipl-auction-8a8o.onrender.com/api'),
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
});
