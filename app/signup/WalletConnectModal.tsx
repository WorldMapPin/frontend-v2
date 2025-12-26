'use client';

import { useState } from 'react';
import { Providers, KeyTypes } from '@aioha/aioha';
import { useAiohaSafe } from '@/hooks/use-aioha-safe';
import { X, Wallet, Key, Globe, AlertCircle, Loader2, LogOut, User, CheckCircle2, Box, Shield } from 'lucide-react';

interface WalletConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (result: any) => void;
}

export default function WalletConnectModal({ isOpen, onClose, onLoginSuccess }: WalletConnectModalProps) {
    const { aioha, user, logout } = useAiohaSafe();
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleLogin = async (provider: Providers) => {
        if (!aioha) return;

        // Validation
        if (!username) {
            setError('Please enter your Hive username');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const options = {
                msg: 'Login to WorldMapPin',
                keyType: KeyTypes.Posting
            };

            // Call Aioha login
            // Note: aioha.login signature is typically (provider, username, options)
            const result = await aioha.login(provider, username, options);

            console.log('Login result:', result);

            if (result && result.success) {
                onLoginSuccess(result);
            } else {
                setError(result?.error || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'An unexpected error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            setLoading(true);
            await logout();
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 wallet-modal-backdrop"
            onClick={onClose}
        >
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <div
                className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 wallet-modal-container"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="bg-gradient-to-br from-[#F97316] to-[#F59E0B] p-8 relative overflow-hidden">
                    {/* Abstract Background Elements */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <Globe className="absolute -right-6 -bottom-6 w-40 h-40 text-white" />
                        <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-xl opacity-20 transform -translate-x-1/2 -translate-y-1/2"></div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm z-20"
                        aria-label="Close modal"
                    >
                        <X size={20} />
                    </button>

                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold text-white mb-2 font-lexend tracking-tight">
                            {user ? 'Account Connected' : 'Connect Wallet'}
                        </h2>
                        <p className="text-orange-50 text-sm font-medium font-lexend leading-relaxed max-w-[85%]">
                            {user
                                ? 'You are currently signed in to WorldMapPin.'
                                : 'Sign in to save your pins and track your travel stats on the blockchain.'
                            }
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {user ? (
                        // Logged In View
                        <div className="space-y-6">
                            <div className="wallet-user-card rounded-2xl p-6 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                                    <User size={32} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold font-lexend mb-1" style={{ color: 'var(--text-primary)' }}>@{user}</h3>
                                <div className="flex items-center gap-1.5 px-3 py-1 wallet-active-badge rounded-full text-xs font-bold">
                                    <CheckCircle2 size={12} />
                                    <span>Active Session</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="flex items-center justify-center gap-2 p-3.5 font-lexend font-bold rounded-xl transition-colors wallet-logout-btn"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
                                    <span>Logout</span>
                                </button>
                                <button
                                    onClick={() => onClose()}
                                    className="flex items-center justify-center gap-2 p-3.5 font-lexend font-bold rounded-xl transition-colors shadow-lg wallet-continue-btn"
                                >
                                    <span>Continue</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        // Login View
                        <>
                            {/* Username Input */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider font-lexend ml-1" style={{ color: 'var(--text-muted)' }}>
                                    Hive Username
                                </label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold group-focus-within:text-orange-500 transition-colors" style={{ color: 'var(--text-muted)' }}>@</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => {
                                            setUsername(e.target.value.toLowerCase().trim());
                                            if (error) setError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && username && !loading) {
                                                handleLogin(Providers.Keychain);
                                            }
                                        }}
                                        placeholder="username"
                                        disabled={loading}
                                        className="w-full pl-9 pr-4 py-3.5 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-lexend font-medium disabled:opacity-70 wallet-input"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 rounded-xl text-sm font-medium flex items-start gap-3 animate-in slide-in-from-top-2 wallet-error">
                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{error}</span>
                                </div>
                            )}

                            {/* Providers */}
                            {/* Providers Container */}
                            <div className="pt-2">
                                <p className="text-xs font-bold uppercase tracking-wider font-lexend ml-1 mb-3" style={{ color: 'var(--text-muted)' }}>
                                    Select Method
                                </p>

                                {/* Scrollable area limited to 3 items */}
                                <div className="space-y-3 max-h-[285px] overflow-y-auto no-scrollbar pr-1">

                                    <button
                                        onClick={() => handleLogin(Providers.Keychain)}
                                        disabled={loading || !username}
                                        className="w-full flex items-center justify-between p-4 border-2 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none wallet-provider-btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                                {/* Key Icon - Keychain */}
                                                <Key size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold font-lexend text-base" style={{ color: 'var(--text-primary)' }}>Hive Keychain</div>
                                                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Browser Extension</div>
                                            </div>
                                        </div>
                                        {loading ? (
                                            <div className="w-10 h-10 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all wallet-provider-arrow">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => handleLogin(Providers.HiveSigner)}
                                        disabled={loading || !username}
                                        className="w-full flex items-center justify-between p-4 border-2 hover:border-[#E31337] hover:shadow-lg hover:shadow-[#E31337]/10 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none wallet-provider-btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#E31337] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                                <Wallet size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold font-lexend text-base" style={{ color: 'var(--text-primary)' }}>HiveSigner</div>
                                                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Mobile & Web</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-[#E31337] group-hover:text-white group-hover:border-[#E31337] transition-all wallet-provider-arrow">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleLogin(Providers.HiveAuth)}
                                        disabled={loading || !username}
                                        className="w-full flex items-center justify-between p-4 border-2 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none wallet-provider-btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                                <AlertCircle size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold font-lexend text-base" style={{ color: 'var(--text-primary)' }}>Hive Auth</div>
                                                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Mobile QR Solution</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all wallet-provider-arrow">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleLogin(Providers.MetaMaskSnap)}
                                        disabled={loading || !username}
                                        className="w-full flex items-center justify-between p-4 border-2 hover:border-[#F6851B] hover:shadow-lg hover:shadow-[#F6851B]/10 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none wallet-provider-btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#F6851B] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                                <Box size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold font-lexend text-base" style={{ color: 'var(--text-primary)' }}>MetaMask Snap</div>
                                                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Ethereum Extension</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-[#F6851B] group-hover:text-white group-hover:border-[#F6851B] transition-all wallet-provider-arrow">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleLogin(Providers.Ledger)}
                                        disabled={loading || !username}
                                        className="w-full flex items-center justify-between p-4 border-2 hover:border-[#4c4c4c] hover:shadow-lg hover:shadow-gray-500/10 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none wallet-provider-btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                                <Shield size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold font-lexend text-base" style={{ color: 'var(--text-primary)' }}>Ledger</div>
                                                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Hardware Wallet</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-gray-600 group-hover:text-white group-hover:border-gray-600 transition-all wallet-provider-arrow">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => handleLogin(Providers.PeakVault)}
                                        disabled={loading || !username}
                                        className="w-full flex items-center justify-between p-4 border-2 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none wallet-provider-btn"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#8B3A3A] rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                                                <Key size={22} />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold font-lexend text-base" style={{ color: 'var(--text-primary)' }}>PeakVault</div>
                                                <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Extension Method</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-[#8B3A3A] group-hover:text-white group-hover:border-[#8B3A3A] transition-all wallet-provider-arrow">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 text-center mt-2">
                                <a
                                    href="https://signup.hive.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-bold hover:text-orange-600 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <span>Don't have a wallet?</span>
                                    <span className="underline decoration-2 decoration-orange-200 hover:decoration-orange-500 underline-offset-2 hover:text-orange-600" style={{ color: 'var(--text-secondary)' }}>Create one for free</span>
                                </a>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
