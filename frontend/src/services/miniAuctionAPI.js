import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const miniAuctionAPI = axios.create({
    baseURL: `${API_BASE}/mini-auction`,
    withCredentials: true
});

// Add auth token to requests
miniAuctionAPI.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const continueGame = async (roomId, teamName, password, budget) => {
    const response = await miniAuctionAPI.post('/continue', {
        roomId,
        teamName,
        password,
        budget
    });
    return response.data;
};

export const releasePlayer = async (miniAuctionId, teamId, playerId) => {
    const response = await miniAuctionAPI.post('/release-player', {
        miniAuctionId,
        teamId,
        playerId
    });
    return response.data;
};

export const getPlayerPool = async (miniAuctionId) => {
    const response = await miniAuctionAPI.get(`/${miniAuctionId}/player-pool`);
    return response.data;
};

export const createTrade = async (miniAuctionId, offeringTeamId, receivingTeamId, offeredPlayerId, wantedPlayerId) => {
    const response = await miniAuctionAPI.post('/trade/create', {
        miniAuctionId,
        offeringTeamId,
        receivingTeamId,
        offeredPlayerId,
        wantedPlayerId
    });
    return response.data;
};

export const respondToTrade = async (tradeId, action, teamId) => {
    const response = await miniAuctionAPI.post(`/trade/${tradeId}/respond`, {
        action,
        teamId
    });
    return response.data;
};

export const sendTradeMessage = async (tradeId, teamId, message) => {
    const response = await miniAuctionAPI.post(`/trade/${tradeId}/message`, {
        teamId,
        message
    });
    return response.data;
};

export const getTeamTrades = async (miniAuctionId, teamId) => {
    const response = await miniAuctionAPI.get('/trades', {
        params: { miniAuctionId, teamId }
    });
    return response.data;
};

export default {
    continueGame,
    releasePlayer,
    getPlayerPool,
    createTrade,
    respondToTrade,
    sendTradeMessage,
    getTeamTrades
};
