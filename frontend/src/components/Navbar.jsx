import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Navbar = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/portal');
    };

    return (
        <nav className="glass-strong border-b border-white/10 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <h1 className="text-xl md:text-2xl font-bold gradient-text">
                            IPL Auction
                        </h1>
                    </div>

                    {/* User Info & Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-sm text-white font-semibold">{user?.name}</span>
                            <span className="text-xs text-gray-400">{user?.role}</span>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
