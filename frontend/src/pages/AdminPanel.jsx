import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, Key, CheckCircle, Database, Trash2, Users } from 'lucide-react';
import { uploadGlobalPlayersAPI, getGlobalPlayersAPI, clearGlobalPlayersAPI, seedGlobalPlayersAPI } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const AdminPanel = () => {
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Fetch players on mount
    React.useEffect(() => {
        fetchPlayers();
    }, []);

    const fetchPlayers = async () => {
        setLoadingPlayers(true);
        try {
            const data = await getGlobalPlayersAPI();
            setPlayers(data.players || []);
        } catch (err) {

            if (err.response?.status === 403) {
                navigate('/welcome');
            }
        } finally {
            setLoadingPlayers(false);
        }
    };

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError('');
        setSuccess('');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await uploadGlobalPlayersAPI(formData);
            setSuccess(`Success! Uploaded ${res.count} players to the global database.`);
            fetchPlayers(); // Refresh list
        } catch (err) {

            setError('Upload failed. Please check the CSV format.');
        } finally {
            setUploading(false);
        }
    };

    const handleClearDatabase = async () => {
        if (!window.confirm("Are you sure? This will delete ALL default players.")) return;

        try {
            const res = await clearGlobalPlayersAPI();
            setSuccess(res.message);
            fetchPlayers();
        } catch (err) {
            setError("Failed to clear database");
        }
    };

    const handleSeedDefaults = async () => {
        if (!window.confirm("This will add ~180 players to the global database. Continue?")) return;

        setUploading(true);
        setError('');
        setSuccess('');

        try {
            const res = await seedGlobalPlayersAPI();
            setSuccess(`Successfully seeded ${res.count} players!`);
            fetchPlayers();
        } catch (err) {
            setError("Failed to seed players");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen p-6 bg-gradient-to-br from-slate-900 to-black">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Database className="text-blue-500" />
                        Admin Dashboard
                    </h1>
                    <div className="flex items-center gap-4">
                        <button onClick={fetchPlayers} className="text-sm text-slate-400 hover:text-white">Refresh</button>
                        <button onClick={() => navigate('/welcome')} className="text-sm text-red-400 hover:text-red-300">
                            Exit Admin
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {/* Upload Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-panel p-6 rounded-2xl border border-white/10 col-span-1"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                                <Upload className="text-blue-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Upload Players</h3>
                                <p className="text-slate-400 text-xs">CSV Only</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg border border-dashed border-white/20 text-center relative hover:bg-white/10 transition-colors">
                                <p className="text-slate-300 text-sm mb-2">Click to Select File</p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>

                            {uploading && (
                                <div className="flex items-center gap-3 text-blue-400 text-sm">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                    Uploading...
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2 text-green-400 text-xs">
                                    <CheckCircle size={14} />
                                    {success}
                                </div>
                            )}

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                                    {error}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-6 rounded-2xl border border-white/10 col-span-1"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                                <Users className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Database Status</h3>
                                <p className="text-slate-400 text-xs">Current Default Players</p>
                            </div>
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">
                            {players.length}
                        </div>
                        <p className="text-slate-500 text-sm">
                            Total players available for new auctions.
                        </p>
                    </motion.div>

                    {/* Seed Data Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-panel p-6 rounded-2xl border border-white/10 col-span-1 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                    <Database className="text-emerald-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Sample Data</h3>
                                    <p className="text-slate-400 text-xs">Auto-Initialize</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm mb-4">
                                Load the default 180+ players curated by the system. Recommended for first-time setup.
                            </p>
                        </div>
                        <button
                            onClick={handleSeedDefaults}
                            disabled={uploading}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                                ${uploading ? 'bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 hove:scale-[1.02]'}`}
                        >
                            <Database size={16} /> Load Sample Data
                        </button>
                    </motion.div>

                    {/* Actions Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-6 rounded-2xl border border-white/10 col-span-1 flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                                    <Trash2 className="text-red-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Danger Zone</h3>
                                    <p className="text-slate-400 text-xs">Manage Database</p>
                                </div>
                            </div>
                            <p className="text-slate-500 text-sm mb-4">
                                Clear the entire default player database. This cannot be undone.
                            </p>
                        </div>
                        <button
                            onClick={handleClearDatabase}
                            className="btn-danger w-full flex items-center justify-center gap-2"
                        >
                            <Trash2 size={16} /> Clear All Data
                        </button>
                    </motion.div>
                </div>

                {/* Player List Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-6 rounded-2xl border border-white/10"
                >
                    <h3 className="text-xl font-bold text-white mb-6">Uploaded Player List</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-slate-400 text-sm border-b border-white/10">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Country</th>
                                    <th className="p-3">Base Price</th>
                                    <th className="p-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {loadingPlayers ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading players...</td></tr>
                                ) : players.length === 0 ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-slate-500">No players found in default database. Upload a CSV to get started.</td></tr>
                                ) : (
                                    players.slice(0, 50).map((player) => (
                                        <tr key={player._id} className="border-b border-white/5 hover:bg-white/5 text-slate-300">
                                            <td className="p-3 font-medium text-white">{player.name}</td>
                                            <td className="p-3"><span className="px-2 py-1 rounded bg-slate-800 text-xs">{player.role}</span></td>
                                            <td className="p-3">{player.country}</td>
                                            <td className="p-3 text-emerald-400">{formatCurrency(player.basePrice)}</td>
                                            <td className="p-3"><span className="text-blue-400 text-xs">DEFAULT</span></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {players.length > 50 && (
                            <div className="p-4 text-center text-slate-500 text-xs border-t border-white/10">
                                Showing first 50 of {players.length} players
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminPanel;
