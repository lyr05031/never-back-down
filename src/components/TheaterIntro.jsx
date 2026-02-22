import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react'; // 引入返回图标

export default function TheaterIntro({ persona, onComplete, onBack }) {
    const data = persona || {
        A: "深夜看病的急诊病人",
        B: "睡迷糊的值班护士",
        C: "把碘酒当糖水喂给病人喝了"
    };

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            onComplete();
        }, 12000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center font-sans"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 1, 0] }}
            transition={{ duration: 12, times: [0, 0.95, 1], ease: "easeInOut" }}
        >
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>

            {/* 【新增】：返回大厅按钮 */}
            <button
                onClick={onBack}
                className="absolute z-50 top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-white transition-colors hover:bg-white/10 p-2 rounded-lg"
            >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                <span className="hidden md:inline text-xs font-bold tracking-widest uppercase">返回大厅</span>
            </button>

            {/* 1. 对方 (Judge) */}
            <motion.div
                className="absolute z-20 text-red-500 font-black tracking-widest flex flex-col items-center"
                initial={{ opacity: 0, scale: isMobile ? 1.2 : 2, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                animate={{
                    opacity: [0, 1, 1, 1],
                    scale: [isMobile ? 1.2 : 2, 1, 1, isMobile ? 0.7 : 0.45],
                    top: ['50%', '50%', '50%', isMobile ? '18%' : '15%'],
                    left: ['50%', '50%', '50%', isMobile ? '50%' : '15%'],
                    x: ['-50%', '-50%', '-50%', '-50%'],
                    y: ['-50%', '-50%', '-50%', '-50%']
                }}
                transition={{ duration: 3, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
            >
                <motion.div
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{ duration: 8, times: [0, 0.8, 1] }}
                    className="text-lg md:text-2xl text-red-300 mb-1 md:mb-2 uppercase tracking-[0.5em] drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                >
                    对方
                </motion.div>
                <div className="text-3xl md:text-5xl lg:text-7xl whitespace-nowrap drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                    {data.A}
                </div>
            </motion.div>

            {/* 2. 你 (You) */}
            <motion.div
                className="absolute z-20 text-cyan-500 font-black tracking-widest flex flex-col items-center"
                initial={{ opacity: 0, scale: isMobile ? 1.2 : 2, top: '50%', left: '50%', x: '-50%', y: '-50%' }}
                animate={{
                    opacity: [0, 1, 1, 1],
                    scale: [isMobile ? 1.2 : 2, 1, 1, isMobile ? 0.7 : 0.45],
                    top: ['50%', '50%', '50%', isMobile ? '82%' : '15%'],
                    left: ['50%', '50%', '50%', isMobile ? '50%' : '85%'],
                    x: ['-50%', '-50%', '-50%', '-50%'],
                    y: ['-50%', '-50%', '-50%', '-50%']
                }}
                transition={{ duration: 3, delay: 2.5, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
            >
                <motion.div
                    animate={{ opacity: [1, 1, 0] }}
                    transition={{ duration: 5.5, delay: 2.5, times: [0, 0.8, 1] }}
                    className="text-lg md:text-2xl text-cyan-300 mb-1 md:mb-2 uppercase tracking-[0.5em] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                >
                    你
                </motion.div>
                <div className="text-3xl md:text-5xl lg:text-7xl whitespace-nowrap drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    {data.B}
                </div>
            </motion.div>

            {/* 3. 前置语 */}
            <motion.div
                className="absolute z-30 text-gray-400 text-lg md:text-2xl font-bold tracking-widest text-center w-full px-4"
                initial={{ opacity: 0, top: '40%', y: '-50%' }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9], y: ['-50%', '-50%', '-50%', '-50%'] }}
                transition={{ duration: 2.5, delay: 5.5, times: [0, 0.2, 0.8, 1], ease: "easeInOut" }}
            >
                你刚刚在对方面前，
            </motion.div>

            {/* 4. 惨状 */}
            <motion.div
                className="absolute z-30 flex flex-col items-center w-full px-6 md:px-10"
                initial={{ opacity: 0, scale: 0.2, top: '55%', y: '-50%' }}
                animate={{ opacity: [0, 1, 1, 1], scale: [0.2, 1.2, 1, 1], top: ['55%', '55%', '55%', '55%'], y: ['-50%', '-50%', '-50%', '-50%'] }}
                transition={{ duration: 4, delay: 8.0, times: [0, 0.1, 0.7, 1], ease: "easeInOut" }}
            >
                <div className="text-2xl md:text-4xl lg:text-6xl text-center leading-relaxed max-w-[90vw] md:max-w-5xl text-red-500 font-black tracking-wider drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] border-b-2 border-red-900 pb-2 md:pb-4">
                    {data.C}
                </div>
                <div className="text-sm md:text-2xl text-red-900 mt-4 md:mt-6 opacity-80 uppercase tracking-[0.5em] font-bold">
                    CRITICAL ERROR
                </div>
            </motion.div>

        </motion.div>
    );
}