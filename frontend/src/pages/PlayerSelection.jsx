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

    const handleDefault = async () => {
        setLoading(true);
        try {
            await setupDefaultPlayersAPI(roomId);
            navigate(`/auction/${roomId}`);
        } catch (error) {
            console.error("Error loading default players:", error);
            alert("Error loading default players");
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
            await uploadPlayersAPI(formData);
            navigate(`/auction/${roomId}`);
        } catch (error) {
            console.error("Error uploading file:", error);
            const msg = error.response?.data?.message || "Error uploading file. Please ensure it's a valid CSV.";
            alert(msg);
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
        </div>
    );
};

export default PlayerSelection;
