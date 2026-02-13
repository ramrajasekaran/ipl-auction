import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:5000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth APIs
export const loginAPI = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const registerAPI = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const logoutAPI = async () => {
    const response = await api.post('/auth/logout');
    return response.data;
};

export const verifyEmailAPI = async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
};

export const resendVerificationAPI = async (email) => {
    const response = await api.post('/auth/resend-verification', { email });
    return response.data;
};

export const createGameAPI = async (budget, password) => {
    const response = await api.post('/games/create', { budget, password });
    return response.data;
};

export const joinGameAPI = async (roomId, teamName, email, password) => {
    const response = await api.post('/games/join', { roomId, teamName, email, password });
    return response.data;
};

export const rejoinTeamAPI = async (roomId, teamName, password) => {
    const response = await api.post('/games/rejoin', { roomId, teamName, password });
    return response.data;
};

export const resumeGameAPI = async (roomId, password) => {
    const response = await api.post('/games/resume', { roomId, password });
    return response.data;
};

export const releasePlayerAPI = async (roomId, teamId, playerId) => {
    const response = await api.post('/games/players/release', { roomId, teamId, playerId });
    return response.data;
};

// Trade APIs
export const proposeTradeAPI = async (tradeData) => {
    const response = await api.post('/trades/propose', tradeData);
    return response.data;
};

export const getMyTradesAPI = async (teamId) => {
    const response = await api.get(`/trades/my/${teamId}`);
    return response.data;
};

export const respondToTradeAPI = async (tradeId, status) => {
    const response = await api.post('/trades/respond', { tradeId, status });
    return response.data;
};

// Password Reset APIs (Global User Auth)
export const sendResetOTPAPI = async (payload) => {
    const response = await api.post('/auth/send-reset-otp', payload);
    return response.data;
};

export const verifyOTPAPI = async (payload) => {
    const response = await api.post('/auth/verify-otp', payload);
    return response.data;
};

export const resetPasswordOTPAPI = async (payload) => {
    const response = await api.post('/auth/verify-reset-otp', payload);
    return response.data;
};

// Global Player Database APIs
export const searchGlobalPlayersAPI = async (query) => {
    const response = await api.get(`/players/global-search?q=${query}`);
    return response.data;
};

export const activateGlobalPlayerAPI = async (playerId, auctionId) => {
    const response = await api.post('/players/activate', { playerId, auctionId });
    return response.data;
};

// Player Initialization APIs
export const setupDefaultPlayersAPI = async (roomId) => {
    const response = await api.post('/games/players/default', { roomId });
    return response.data;
};

export const uploadPlayersAPI = async (formData) => {
    const response = await api.post('/games/players/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// Admin API
export const uploadGlobalPlayersAPI = async (formData) => {
    const response = await api.post('/games/players/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getGlobalPlayersAPI = async () => {
    const response = await api.get('/games/players/admin/global');
    return response.data;
};

export const clearGlobalPlayersAPI = async () => {
    const response = await api.delete('/games/players/admin/global');
    return response.data;
};

export const seedGlobalPlayersAPI = async () => {
    const response = await api.post('/games/players/admin/seed');
    return response.data;
};

// Auction API namespace
export const auctionAPI = {
    getLatest: () => api.get('/auction/latest'),
    getTeams: (auctionId) => api.get(`/auction/${auctionId}/teams`),
    placeBid: (auctionId, amount) => api.post(`/auction/${auctionId}/bid`, { amount })
};

// Payment APIs
export const createPaymentOrderAPI = async (amount) => {
    const response = await api.post('/payment/order', { amount });
    return response.data;
};

export const verifyPaymentAPI = async (paymentData) => {
    const response = await api.post('/payment/verify', paymentData);
    return response.data;
};

export default api;
