import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (token, user) => {
                localStorage.setItem('token', token);
                set({
                    token,
                    user,
                    isAuthenticated: true,
                });
            },

            logout: () => {
                localStorage.removeItem('token');
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
            },

            checkAuth: () => {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const decoded = jwtDecode(token);
                        // Check if token is expired
                        if (decoded.exp * 1000 < Date.now()) {
                            get().logout();
                            return false;
                        }
                        return true;
                    } catch (error) {
                        get().logout();
                        return false;
                    }
                }
                return false;
            },

            getRole: () => {
                return get().user?.role || null;
            },

            isAuctioneer: () => {
                return get().user?.role === 'AUCTIONEER';
            },

            isTeamOwner: () => {
                return get().user?.role === 'TEAM_OWNER';
            },
        }),
        {
            name: 'auth-storage',
            getStorage: () => localStorage,
        }
    )
);

export default useAuthStore;
