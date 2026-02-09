import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';

import LandingPage from './pages/LandingPage';
import WelcomeScreen from './pages/WelcomeScreen';
import MiniAuctionPage from './pages/MiniAuctionPage';
import ManagerAuth from './pages/ManagerAuth';
import ContestantAuth from './pages/ContestantAuth';
import AuctionRoom from './pages/AuctionRoom';
import PlayerSelection from './pages/PlayerSelection';
import ResetPassword from './pages/ResetPassword';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPanel from './pages/AdminPanel'; // Import
import ContinueGamePage from './pages/ContinueGamePage'; // Mini Auction
import PlayerReleasePage from './pages/PlayerReleasePage'; // Mini Auction

// ... imports remain the same

// ... inside App component

const ProtectedRoute = ({ children, role }) => {
    const authToken = sessionStorage.getItem('authToken');
    const authUser = sessionStorage.getItem('authUser');

    console.log('[ProtectedRoute] Token exists:', !!authToken);
    console.log('[ProtectedRoute] User data exists:', !!authUser);

    // Check if user is authenticated
    if (!authToken || !authUser) {
        console.log('[ProtectedRoute] Missing token or user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Verify authUser has valid email and check role if specified
    try {
        const user = JSON.parse(authUser);
        console.log('[ProtectedRoute] Parsed user:', user);

        if (!user.email) {
            console.log('[ProtectedRoute] No email, redirecting to register');
            sessionStorage.clear();
            return <Navigate to="/register" replace />;
        }

        // MASTER ADMIN OVERRIDE
        if (user.email.toLowerCase() === 'sriramsriram16145@gmail.com' && user.role !== 'ADMIN') {
            console.log('[ProtectedRoute] Applying Master Admin Override');
            user.role = 'ADMIN';
            sessionStorage.setItem('authUser', JSON.stringify(user));
        }

        if (role && user.role !== role) {
            console.log(`[ProtectedRoute] Role mismatch: required ${role}, found ${user.role}. Redirecting to welcome.`);
            return <Navigate to="/welcome" replace />;
        }
    } catch (error) {
        console.error('[ProtectedRoute] Parse error:', error);
        sessionStorage.clear();
        return <Navigate to="/register" replace />;
    }

    console.log('[ProtectedRoute] Auth passed');
    return children;
};

// Root redirect based on auth status
const RootRedirect = () => {
    const isAuthenticated = sessionStorage.getItem('authToken') && sessionStorage.getItem('authUser');
    return <Navigate to={isAuthenticated ? "/welcome" : "/login"} replace />;
};

function App() {
    return (
        <div className="min-h-screen bg-background text-foreground antialiased font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0f1c] to-black">
            <GameProvider>
                <Router>
                    <Routes>
                        {/* Public Auth Routes */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />

                        {/* Root Redirect */}
                        <Route path="/" element={<RootRedirect />} />

                        {/* Protected Routes */}
                        <Route path="/welcome" element={<ProtectedRoute><WelcomeScreen /></ProtectedRoute>} />
                        <Route path="/mega-auction" element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
                        <Route path="/mini-auction" element={<ProtectedRoute><MiniAuctionPage /></ProtectedRoute>} />

                        {/* ADMIN ROUTE - Restricted to ADMIN role */}
                        <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminPanel /></ProtectedRoute>} />

                        <Route path="/manager" element={<ProtectedRoute><ManagerAuth /></ProtectedRoute>} />
                        <Route path="/manager-auth" element={<ProtectedRoute><ManagerAuth /></ProtectedRoute>} />
                        <Route path="/join" element={<ProtectedRoute><ContestantAuth /></ProtectedRoute>} />
                        <Route path="/contestant-auth" element={<ProtectedRoute><ContestantAuth /></ProtectedRoute>} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/setup-players/:roomId" element={<ProtectedRoute><PlayerSelection /></ProtectedRoute>} />
                        <Route path="/auction/:roomId" element={<ProtectedRoute><AuctionRoom /></ProtectedRoute>} />

                        {/* Mini Auction Routes */}
                        <Route path="/continue-game" element={<ProtectedRoute><MiniAuctionPage /></ProtectedRoute>} />
                        <Route path="/mini-auction/:miniAuctionId/release" element={<ProtectedRoute><PlayerReleasePage /></ProtectedRoute>} />
                        <Route path="/mini-auction/:miniAuctionId" element={<ProtectedRoute><AuctionRoom /></ProtectedRoute>} />

                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </GameProvider>
        </div>
    );
}

export default App;
