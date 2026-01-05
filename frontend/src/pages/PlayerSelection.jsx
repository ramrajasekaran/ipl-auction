import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Upload, CheckCircle, Database } from 'lucide-react';
import { setupDefaultPlayersAPI, uploadPlayersAPI } from '../services/api';

const PlayerSelection = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', message: '', isSuccess: false });

    const handleDefault = async () => {
        setLoading(true);
        try {
            const data = await setupDefaultPlayersAPI(roomId);
            const count = data.count || 0;
            const maxTeams = Math.max(2, Math.floor(count / 25));

            setModalContent({
                title: 'Data Loaded Successfully',
                message: `Loaded ${count} players from default database.\n\nBased on squad size limits (25 players/team), this room allows a MAXIMUM of ${maxTeams} TEAMS.`,
                isSuccess: true
            });
            setShowModal(true);
        } catch (error) {
            console.error("Error loading default players:", error);
            setModalContent({
                title: 'Load Failed',
                message: 'Failed to load default players. Please try again.',
                isSuccess: false
            });
            setShowModal(true);
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);

        try {
            const data = await uploadPlayersAPI(formData);
            const count = data.count || 0;
            const maxTeams = Math.max(2, Math.floor(count / 25));

            setModalContent({
                title: 'Upload Successful',
                message: `Uploaded ${count} players.\n\nBased on squad size limits (25 players/team), this room allows a MAXIMUM of ${maxTeams} TEAMS.`,
                isSuccess: true
            });
            setShowModal(true);
        } catch (error) {
            console.error("Error uploading file:", error);
            const msg = error.response?.data?.message || "Error uploading file. Please ensure it's a valid CSV.";

            setModalContent({
                title: 'Upload Failed',
                message: msg,
                isSuccess: false
            });
            setShowModal(true);
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-black">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl w-full text-center"
            >
                <h1 className="text-4xl font-bold text-white mb-8">Setup Auction Players</h1>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Default Option */}
                    <button
                        onClick={handleDefault}
                        disabled={loading || uploading}
                        className="group relative p-8 glass-panel rounded-2xl hover:bg-primary/10 transition-all border border-white/10 hover:border-primary/50 text-left"
                    >
                        <Database className="text-primary mb-4" size={40} />
                        <h3 className="text-xl font-bold text-white mb-2">Default Database</h3>
                        <p className="text-slate-400 text-sm">
                            Use our curated list of 200+ top cricket players with complete stats.
                        </p>
                        {loading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>}
                    </button>

                    {/* Custom Upload Option */}
                    <div className="group relative p-8 glass-panel rounded-2xl hover:bg-blue-500/10 transition-all border border-white/10 hover:border-blue-500/50 text-left cursor-pointer">
                        <Upload className="text-blue-500 mb-4" size={40} />
                        <h3 className="text-xl font-bold text-white mb-2">Upload CSV</h3>
                        Upload your player list. **.csv files only**. Columns: Name, Role, BasePrice.
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleUpload}
                            className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20"
                        />
                        {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>}
                    </div>
                </div>
            </motion.div>

            {/* Custom Modal Overlay */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
                    >
                        {/* Background Glow */}
                        <div className={`absolute top-0 left-0 w-full h-1 ${modalContent.isSuccess ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] ${modalContent.isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'}`} />

                        <div className="relative z-10">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${modalContent.isSuccess ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                {modalContent.isSuccess ? <CheckCircle size={24} /> : <Users size={24} />}
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-2">
                                {modalContent.title}
                            </h3>

                            <p className="text-slate-300 mb-8 whitespace-pre-line leading-relaxed text-sm">
                                {modalContent.message}
                            </p>

                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    if (modalContent.isSuccess) navigate(`/auction/${roomId}`);
                                }}
                                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2
                                    ${modalContent.isSuccess
                                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-green-900/20'
                                        : 'bg-white/10 hover:bg-white/20'
                                    }`}
                            >
                                {modalContent.isSuccess ? 'Enter Auction Room' : 'Close'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default PlayerSelection;
