import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Cpu, Zap, Settings2, X, CheckCircle2, Thermometer, Activity } from 'lucide-react';

const PRESETS = {
    deepseek: {
        api_key: "YOUR API KEY",
        base_url: "https://api.deepseek.com",
        model_name: "deepseek-chat",
        default_temps: { persona: 1.6, judge: 1.5, partner: 1.5 }
    },
    gemini: {
        api_key: "YOUR API KEY",
        base_url: "https://generativelanguage.googleapis.com/v1beta/openai/",
        model_name: "gemini-3-flash-preview",
        default_temps: { persona: 1.2, judge: 1.2, partner: 1.2 }
    }
};

export default function Landing({ onSelect, onGoAdmin }) {
    const [hovered, setHovered] = useState(null);

    // 【新增】：拆分为红方和蓝方两个 Prompt
    const [bluePrompt, setBluePrompt] = useState("");
    const [redPrompt, setRedPrompt] = useState("");

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [showEngineModal, setShowEngineModal] = useState(false);
    const [selectedMode, setSelectedMode] = useState(null);
    const [userRole, setUserRole] = useState('judge');

    const [engine, setEngine] = useState('gemini');
    const [customConfig, setCustomConfig] = useState({ api_key: '', base_url: '', model_name: '' });
    const [temps, setTemps] = useState({ ...PRESETS.gemini.default_temps });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const desktopDefaultLeft = "polygon(0 0, 52% 0, 48% 100%, 0% 100%)";
    const desktopDefaultRight = "polygon(52% 0, 100% 0, 100% 100%, 48% 100%)";
    const desktopHoverLeft_Left = "polygon(0 0, 58% 0, 54% 100%, 0% 100%)";
    const desktopHoverLeft_Right = "polygon(58% 0, 100% 0, 100% 100%, 54% 100%)";
    const desktopHoverRight_Left = "polygon(0 0, 46% 0, 42% 100%, 0% 100%)";
    const desktopHoverRight_Right = "polygon(46% 0, 100% 0, 100% 100%, 42% 100%)";
    const desktopCenterLine = {
        default: "polygon(51.9% 0, 52.1% 0, 48.1% 100%, 47.9% 100%)",
        hoverLeft: "polygon(57.9% 0, 58.1% 0, 54.1% 100%, 53.9% 100%)",
        hoverRight: "polygon(45.9% 0, 46.1% 0, 42.1% 100%, 41.9% 100%)"
    };

    const mobileDefaultTop = "polygon(0 0, 100% 0, 100% 47%, 0 53%)";
    const mobileDefaultBottom = "polygon(0 53%, 100% 47%, 100% 100%, 0 100%)";
    const mobileHoverTop_Top = "polygon(0 0, 100% 0, 100% 55%, 0 61%)";
    const mobileHoverTop_Bottom = "polygon(0 61%, 100% 55%, 100% 100%, 0 100%)";
    const mobileHoverBottom_Top = "polygon(0 0, 100% 0, 100% 39%, 0 45%)";
    const mobileHoverBottom_Bottom = "polygon(0 45%, 100% 39%, 100% 100%, 0 100%)";
    const mobileCenterLine = {
        default: "polygon(0 52.8%, 100% 46.8%, 100% 47.2%, 0 53.2%)",
        hoverTop: "polygon(0 60.8%, 100% 54.8%, 100% 55.2%, 0 61.2%)",
        hoverBottom: "polygon(0 44.8%, 100% 38.8%, 100% 39.2%, 0 45.2%)"
    };

    const leftPath = isMobile ? (hovered === 'auto' ? mobileHoverTop_Top : hovered === 'half' ? mobileHoverBottom_Top : mobileDefaultTop) : (hovered === 'auto' ? desktopHoverLeft_Left : hovered === 'half' ? desktopHoverRight_Left : desktopDefaultLeft);
    const rightPath = isMobile ? (hovered === 'auto' ? mobileHoverTop_Bottom : hovered === 'half' ? mobileHoverBottom_Bottom : mobileDefaultBottom) : (hovered === 'auto' ? desktopHoverLeft_Right : hovered === 'half' ? desktopHoverRight_Right : desktopDefaultRight);
    const centerPath = isMobile ? (hovered === 'auto' ? mobileCenterLine.hoverTop : hovered === 'half' ? mobileCenterLine.hoverBottom : mobileCenterLine.default) : (hovered === 'auto' ? desktopCenterLine.hoverLeft : hovered === 'half' ? desktopCenterLine.hoverRight : desktopCenterLine.default);

    const transition = { duration: 0.5, ease: "easeOut" };

    const handleModeClick = (mode) => {
        setSelectedMode(mode);
        setShowEngineModal(true);
    };

    const handleEngineChange = (prov) => {
        setEngine(prov);
        if (prov === 'deepseek') setTemps({ ...PRESETS.deepseek.default_temps });
        else if (prov === 'gemini') setTemps({ ...PRESETS.gemini.default_temps });
        else setTemps({ persona: 1.0, judge: 1.0, partner: 1.0 });
    };

    const handleLaunch = () => {
        let finalConfig;
        if (engine === 'custom') {
            if (!customConfig.api_key || !customConfig.base_url || !customConfig.model_name) {
                return alert('请填写完整的自定义配置！');
            }
            finalConfig = { ...customConfig };
        } else {
            finalConfig = { ...PRESETS[engine] };
        }
        finalConfig.temp_persona = parseFloat(temps.persona);
        finalConfig.temp_judge = parseFloat(temps.judge);
        finalConfig.temp_partner = parseFloat(temps.partner);

        setShowEngineModal(false);
        // 把两个 Prompt 打包传出去
        onSelect(selectedMode, { bluePrompt, redPrompt }, finalConfig, userRole);
    };

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-black font-sans">

            <div className="absolute z-40 top-8 md:top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none w-full px-4 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-[0.2em] text-white mb-2 md:mb-3 drop-shadow-md whitespace-nowrap">绝不认错</h1>
                <div className="flex items-center gap-1 md:gap-2 text-gray-500 tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-xs font-medium uppercase whitespace-nowrap">
                    <Zap className="w-3 h-3 text-gray-600" /><span>Never Back Down</span><Zap className="w-3 h-3 text-gray-600" />
                </div>
            </div>

            <motion.div className="absolute inset-0 z-10 pointer-events-none bg-white/50" style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.6)) blur(2px)' }} animate={{ clipPath: centerPath }} transition={transition} />

            {/* 左侧：蓝方 AI */}
            <motion.div
                className="absolute inset-0 z-0 flex flex-col justify-start md:justify-center items-center md:items-start pt-[20vh] md:pt-0 pl-0 md:pl-[12vw] cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #051a25 0%, #000000 100%)' }}
                animate={{ clipPath: leftPath, filter: hovered === 'auto' || showEngineModal ? 'brightness(1.2)' : hovered === 'half' ? 'brightness(0.4)' : 'brightness(1)' }}
                transition={transition}
                onMouseEnter={() => setHovered('auto')} onMouseLeave={() => setHovered(null)}
                onClick={() => handleModeClick('AUTO')}
            >
                <motion.div animate={{ scale: hovered === 'auto' ? 1.05 : 1, x: !isMobile && hovered === 'auto' ? 20 : 0, y: isMobile && hovered === 'auto' ? 10 : 0 }} transition={transition} className="flex flex-col items-center md:items-start text-center md:text-left px-8 md:px-0">
                    <Cpu className="w-12 h-12 md:w-16 md:h-16 text-cyan-500 mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-1 md:mb-2 tracking-tighter">电子斗蛐蛐</h1>
                    <p className="text-sm md:text-xl text-cyan-300 font-bold tracking-widest uppercase">AI vs AI</p>
                    <p className="mt-3 md:mt-4 text-[13px] md:text-sm text-gray-400 max-w-[280px] md:max-w-xs leading-relaxed font-light tracking-wide">赛博吃瓜群众首选。全自动大乱斗，看两个极度暴躁、绝不认错的 AI 如何在这里互相破防。</p>
                </motion.div>
            </motion.div>

            {/* 右侧：红方 人类 */}
            <motion.div
                className="absolute inset-0 z-0 flex flex-col justify-end md:justify-center items-center md:items-end pb-[15vh] md:pb-0 pr-0 md:pr-[12vw] cursor-pointer"
                style={{ background: 'linear-gradient(225deg, #300505 0%, #000000 100%)' }}
                animate={{ clipPath: rightPath, filter: hovered === 'half' || showEngineModal ? 'brightness(1.2)' : hovered === 'auto' ? 'brightness(0.4)' : 'brightness(1)' }}
                transition={transition}
                onMouseEnter={() => setHovered('half')} onMouseLeave={() => setHovered(null)}
                onClick={() => handleModeClick('HALF')}
            >
                <motion.div animate={{ scale: hovered === 'half' ? 1.05 : 1, x: !isMobile && hovered === 'half' ? -20 : 0, y: isMobile && hovered === 'half' ? -10 : 0 }} transition={transition} className="flex flex-col items-center md:items-end text-center md:text-right px-8 md:px-0">
                    <User className="w-12 h-12 md:w-16 md:h-16 text-red-500 mb-3 md:mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-1 md:mb-2 tracking-tighter">亲自对线</h1>
                    <p className="text-sm md:text-xl text-red-300 font-bold tracking-widest uppercase">Human vs AI</p>
                    <p className="mt-3 md:mt-4 text-[13px] md:text-sm text-gray-400 max-w-[280px] md:max-w-xs leading-relaxed font-light tracking-wide">人类亲自接管键盘。你可以选择当施压者狂喷，也可以当闯祸者疯狂狡辩！</p>
                </motion.div>
            </motion.div>

            {/* 【全新设计】：底部双向 Prompt 注入槽 */}
            <div className="absolute z-40 bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 w-11/12 md:w-3/4 max-w-4xl flex flex-col md:flex-row gap-3 md:gap-6 pointer-events-auto">
                {/* 蓝方输入 */}
                <div className="relative group flex-1">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                    <div className="relative flex items-center bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 border border-cyan-900/50">
                        <Settings2 className="w-4 h-4 md:w-5 md:h-5 text-cyan-500 mr-2 md:mr-3 flex-shrink-0" />
                        <input
                            type="text"
                            value={bluePrompt}
                            onChange={(e) => setBluePrompt(e.target.value)}
                            placeholder="[可选] 注入蓝方(狡辩者)设定..."
                            className="bg-transparent w-full text-white text-xs md:text-sm focus:outline-none placeholder:text-gray-500"
                        />
                    </div>
                </div>
                {/* 红方输入 */}
                <div className="relative group flex-1">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl blur opacity-30 group-hover:opacity-70 transition duration-500"></div>
                    <div className="relative flex items-center bg-black/60 backdrop-blur-md rounded-xl px-4 py-3 border border-red-900/50">
                        <Settings2 className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 md:mr-3 flex-shrink-0" />
                        <input
                            type="text"
                            value={redPrompt}
                            onChange={(e) => setRedPrompt(e.target.value)}
                            placeholder="[可选] 注入红方(施压者)设定..."
                            className="bg-transparent w-full text-white text-xs md:text-sm focus:outline-none placeholder:text-gray-500"
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showEngineModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-[#050a0f] border border-cyan-900/50 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] my-8"
                        >
                            <button onClick={() => setShowEngineModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex items-center gap-3 mb-6 text-cyan-500">
                                <Settings2 className="w-6 h-6" />
                                <h2 className="text-xl md:text-2xl font-black tracking-widest uppercase">系统初始化</h2>
                            </div>

                            {/* 阵营选择器 (仅在亲自对线时显示) */}
                            {selectedMode === 'HALF' && (
                                <div className="mb-6 border-b border-white/10 pb-6">
                                    <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-3">选择你的阵营身份</p>
                                    <div className="flex gap-2 p-1 bg-black/50 rounded-lg border border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setUserRole('judge')}
                                            className={`flex-1 py-3 rounded-md text-xs md:text-sm font-black tracking-widest transition-all ${userRole === 'judge' ? 'bg-red-600/20 text-red-500 border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'text-gray-600 hover:text-red-400'
                                                }`}
                                        >
                                            🔴 施压者 (先发制人)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUserRole('partner')}
                                            className={`flex-1 py-3 rounded-md text-xs md:text-sm font-black tracking-widest transition-all ${userRole === 'partner' ? 'bg-cyan-600/20 text-cyan-500 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-gray-600 hover:text-cyan-400'
                                                }`}
                                        >
                                            🔵 狡辩人员 (后手反击)
                                        </button>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-3">大模型核心引擎</p>
                            <div className="flex gap-2 mb-6 p-1 bg-black/50 rounded-lg border border-white/5">
                                {['deepseek', 'gemini', 'custom'].map((prov) => (
                                    <button
                                        key={prov} type="button"
                                        onClick={() => handleEngineChange(prov)}
                                        className={`flex-1 py-2 rounded-md text-xs md:text-sm font-bold tracking-widest uppercase transition-all ${engine === prov ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'text-gray-500 hover:text-gray-300'
                                            }`}
                                    >
                                        {prov === 'gemini' ? (
                                            <span className="flex items-center justify-center gap-1">
                                                GEMINI <span className="text-[10px] text-yellow-500/90">(推荐)</span>
                                            </span>
                                        ) : prov}
                                    </button>
                                ))}
                            </div>

                            {engine === 'custom' && (
                                <div className="space-y-3 mb-6">
                                    <input type="text" placeholder="Base URL" value={customConfig.base_url} onChange={e => setCustomConfig({ ...customConfig, base_url: e.target.value })} className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                                    <input type="password" placeholder="API Key" value={customConfig.api_key} onChange={e => setCustomConfig({ ...customConfig, api_key: e.target.value })} className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                                    <input type="text" placeholder="Model Name" value={customConfig.model_name} onChange={e => setCustomConfig({ ...customConfig, model_name: e.target.value })} className="w-full bg-black/50 border border-gray-800 rounded-lg px-4 py-2 text-white text-sm focus:border-cyan-500 focus:outline-none" />
                                </div>
                            )}

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-orange-400 mb-2">
                                    <Thermometer className="w-4 h-4" />
                                    <span className="text-sm font-bold tracking-widest uppercase">随机度调节 (Temperature)</span>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span>生成剧本随机度</span>
                                        <span className="font-mono text-gray-400">{temps.persona}</span>
                                    </div>
                                    <input type="range" min="0" max="2" step="0.1" value={temps.persona} onChange={(e) => setTemps({ ...temps, persona: e.target.value })} className="w-full accent-gray-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span className="text-red-500 font-bold">施压者随机度</span>
                                        <span className="font-mono text-red-500">{temps.judge}</span>
                                    </div>
                                    <input type="range" min="0" max="2" step="0.1" value={temps.judge} onChange={(e) => setTemps({ ...temps, judge: e.target.value })} className="w-full accent-red-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                        <span className="text-cyan-500 font-bold">狡辩者随机度</span>
                                        <span className="font-mono text-cyan-500">{temps.partner}</span>
                                    </div>
                                    <input type="range" min="0" max="2" step="0.1" value={temps.partner} onChange={(e) => setTemps({ ...temps, partner: e.target.value })} className="w-full accent-cyan-500" />
                                </div>
                            </div>

                            <button onClick={handleLaunch} className="w-full mt-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-widest uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                                <Zap className="w-5 h-5" /> 确认启动
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <button onClick={onGoAdmin} title="进入数据大屏" className="absolute top-6 right-6 md:bottom-6 md:top-auto md:right-6 z-40 text-gray-800 hover:text-cyan-500 transition-colors p-2">
                <Activity className="w-5 h-5" />
            </button>

        </div>
    );
}