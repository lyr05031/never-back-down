import React, { useState, useEffect } from 'react';
import { ArrowLeft, Activity, Server, Zap, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminDashboard({ onBack }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stats");
            const data = await res.json();
            setStats(data);
        } catch (e) {
            console.error("获取统计数据失败", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // 每 5 秒自动刷新一次大屏
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!stats) return <div className="w-screen h-screen bg-black" />;

    const totalCalls = stats.api_calls.deepseek + stats.api_calls.gemini + stats.api_calls.custom;

    // 计算进度条百分比
    const getPercent = (val) => {
        if (totalCalls === 0) return 0;
        return Math.round((val / totalCalls) * 100);
    };

    return (
        <div className="w-screen h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900 via-black to-black"></div>

            {/* 顶部导航 */}
            <div className="absolute top-6 left-6 z-50">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors bg-white/5 p-3 rounded-xl border border-white/10 hover:border-cyan-500/50">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-bold tracking-widest text-sm uppercase">退出中枢</span>
                </button>
            </div>

            <div className="absolute top-6 right-6 z-50">
                <button onClick={fetchStats} className="flex items-center gap-2 text-cyan-500 hover:text-cyan-300 transition-colors bg-white/5 p-3 rounded-xl border border-white/10 hover:border-cyan-500/50">
                    <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative z-10 w-full max-w-4xl p-8 bg-black/40 border border-cyan-900/50 rounded-3xl shadow-[0_0_80px_rgba(6,182,212,0.1)] backdrop-blur-xl"
            >
                <div className="flex items-center justify-center gap-4 mb-12">
                    <Activity className="w-10 h-10 text-cyan-500 animate-pulse" />
                    <h1 className="text-4xl font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                        DashBoard
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* 总对局数统计 */}
                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-gray-400 font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            生成剧本总数
                        </span>
                        <span className="text-7xl font-black text-white">{stats.total_games_started}</span>
                    </div>

                    {/* API 调用总数 */}
                    <div className="flex flex-col items-center justify-center p-8 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-gray-400 font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
                            <Server className="w-5 h-5 text-purple-500" />
                            API 调用总计
                        </span>
                        <span className="text-7xl font-black text-white">{totalCalls}</span>
                    </div>
                </div>

                {/* 模型算力对比条 */}
                <div className="bg-white/5 p-8 rounded-2xl border border-white/5">
                    <h2 className="text-center text-gray-400 font-bold tracking-widest uppercase mb-8">API Calls</h2>

                    <div className="space-y-6">
                        {/* DeepSeek */}
                        <div>
                            <div className="flex justify-between text-sm font-bold tracking-widest mb-2 uppercase">
                                <span className="text-blue-400">DeepSeek</span>
                                <span className="text-blue-200">{stats.api_calls.deepseek} 次 ({getPercent(stats.api_calls.deepseek)}%)</span>
                            </div>
                            <div className="w-full bg-black/50 h-6 rounded-full overflow-hidden border border-blue-900/30">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${getPercent(stats.api_calls.deepseek)}%` }} transition={{ duration: 1 }}
                                    className="h-full bg-gradient-to-r from-blue-900 to-blue-500 relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Gemini */}
                        <div>
                            <div className="flex justify-between text-sm font-bold tracking-widest mb-2 uppercase">
                                <span className="text-cyan-400">Gemini</span>
                                <span className="text-cyan-200">{stats.api_calls.gemini} 次 ({getPercent(stats.api_calls.gemini)}%)</span>
                            </div>
                            <div className="w-full bg-black/50 h-6 rounded-full overflow-hidden border border-cyan-900/30">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${getPercent(stats.api_calls.gemini)}%` }} transition={{ duration: 1 }}
                                    className="h-full bg-gradient-to-r from-cyan-900 to-cyan-400 relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                                </motion.div>
                            </div>
                        </div>

                        {/* Custom */}
                        <div>
                            <div className="flex justify-between text-sm font-bold tracking-widest mb-2 uppercase">
                                <span className="text-gray-400">自定义模型 (Custom)</span>
                                <span className="text-gray-300">{stats.api_calls.custom} 次 ({getPercent(stats.api_calls.custom)}%)</span>
                            </div>
                            <div className="w-full bg-black/50 h-6 rounded-full overflow-hidden border border-gray-800">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${getPercent(stats.api_calls.custom)}%` }} transition={{ duration: 1 }}
                                    className="h-full bg-gradient-to-r from-gray-800 to-gray-500"
                                ></motion.div>
                            </div>
                        </div>
                    </div>
                </div>

            </motion.div>

            {/* 扫光动画定义 */}
            <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
        </div>
    );
}