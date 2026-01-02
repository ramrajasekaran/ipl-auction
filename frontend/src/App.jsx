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

// ... imports remain the same

// ... inside App component

const ProtectedRoute = ({ children }) => {
    const authToken = localStorage.getItem('authToken');
    const authUser = localStorage.getItem('authUser');

    console.log('[ProtectedRoute] Token exists:', !!authToken);
    console.log('[ProtectedRoute] User data exists:', !!authUser);

    // Check if user is authenticated with valid token AND has registered with email
    if (!authToken || !authUser) {
        console.log('[ProtectedRoute] Missing token or user, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Verify authUser has valid email (ensures proper registration)
    try {
        const user = JSON.parse(authUser);
        console.log('[ProtectedRoute] Parsed user:', user);
        console.log('[ProtectedRoute] User email:', user.email);

        if (!user.email) {
            console.log('[ProtectedRoute] No email, redirecting to register');
            localStorage.clear();
            return <Navigate to="/register" replace />;
        }
    } catch (error) {
        console.error('[ProtectedRoute] Parse error:', error);
        localStorage.clear();
        return <Navigate to="/register" replace />;
    }

    console.log('[ProtectedRoute] Auth passed');
    return children;
};

// Root redirect based on auth status
const RootRedirect = () => {
    const isAuthenticated = localStorage.getItem('authToken') && localStorage.getItem('authUser');
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

                        {/* ADMIN ROUTE */}
                        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />

                        <Route path="/manager" element={<ProtectedRoute><ManagerAuth /></ProtectedRoute>} />
                        <Route path="/manager-auth" element={<ProtectedRoute><ManagerAuth /></ProtectedRoute>} />
                        <Route path="/join" element={<ProtectedRoute><ContestantAuth /></ProtectedRoute>} />
                        <Route path="/contestant-auth" element={<ProtectedRoute><ContestantAuth /></ProtectedRoute>} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/setup-players/:roomId" element={<ProtectedRoute><PlayerSelection /></ProtectedRoute>} />
                        <Route path="/auction/:roomId" element={<ProtectedRoute><AuctionRoom /></ProtectedRoute>} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Router>
            </GameProvider>
        </div>
    );
}

export default App;
