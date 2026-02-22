import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Cpu, Loader2, AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function ChatRoom({ mode, persona, extraPrompt, apiConfig, onRestart }) {
    const data = persona || { A: "", B: "", C: "" };

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isThinking, setIsThinking] = useState(true);
    const [isEnded, setIsEnded] = useState(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const isAtBottomRef = useRef(true);

    const hasStarted = useRef(false);
    const isFetchingRef = useRef(false);
    const abortControllerRef = useRef(null);

    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        return () => {
            if (abortControllerRef.current) abortControllerRef.current.abort();
        };
    }, []);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };

    useEffect(() => {
        if (isAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
    }, [messages]);

    const fetchStream = async (url, historyToSent, currentExtraPrompt, roleToAppend) => {
        if (isFetchingRef.current || isEnded) return;
        isFetchingRef.current = true;
        setIsThinking(true);

        setMessages(prev => [...prev, { role: roleToAppend, content: "", isError: false }]);
        abortControllerRef.current = new AbortController();

        try {
            const cleanHistory = historyToSent.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            const res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: abortControllerRef.current.signal,
                body: JSON.stringify({
                    config: apiConfig,
                    persona: data,
                    history: cleanHistory,
                    extra_prompt: currentExtraPrompt
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`[HTTP ${res.status}] ${errText}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    newMsgs[lastIndex] = { ...newMsgs[lastIndex], content: newMsgs[lastIndex].content + chunk };
                    return newMsgs;
                });
            }
        } catch (e) {
            if (e.name === 'AbortError') {
                console.log("请求手动终止");
            } else {
                console.error("API请求崩溃:", e);
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    newMsgs[lastIndex] = {
                        ...newMsgs[lastIndex],
                        content: newMsgs[lastIndex].content + `\n\n🚨 前端连接崩溃！原因：${e.message}`,
                        isError: true
                    };
                    return newMsgs;
                });
                setIsEnded(true);
            }
        } finally {
            setMessages(prev => {
                const newMsgs = [...prev];
                if (newMsgs.length > 0) {
                    const lastMsg = newMsgs[newMsgs.length - 1];
                    if (!lastMsg.content.trim() && !lastMsg.isError) {
                        newMsgs[newMsgs.length - 1] = {
                            ...lastMsg,
                            content: "🚨 无法获取回复！\n(提示：如果您在使用 Gemini，由于您的 Prompt 中包含'极度暴躁'、'骂人'等字眼，极大概率触发了 Google 极其严格的安全拦截(Safety Filter)，导致 API 拒绝输出任何文字。您可以通过修改 Prompt 让语气稍微温和来验证这一点)",
                            isError: true
                        };
                        setIsEnded(true);
                    }
                }
                return newMsgs;
            });
            setIsThinking(false);
            isFetchingRef.current = false;
        }
    };

    const checkEnd = (msgs) => {
        if (msgs.length > 0 && msgs[msgs.length - 1].isError) {
            setIsEnded(true);
            return true;
        }
        if (msgs.length >= 12 && !isEnded) {
            setIsEnded(true);
            return true;
        }
        return false;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length === 0 && !isFetchingRef.current && !isEnded) {
                isAtBottomRef.current = true;
                fetchStream("/api/judge", [], extraPrompt, 'judge');
            }
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (mode !== 'AUTO' || isEnded) return;
        if (messages.length === 0 || isThinking || isFetchingRef.current) return;

        if (checkEnd(messages)) return;

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || !lastMsg.content.trim() || lastMsg.isError) return;

        const timer = setTimeout(() => {
            if (lastMsg.role === 'judge') {
                fetchStream("/api/partner", messages, "", 'you');
            } else {
                fetchStream("/api/judge", messages, extraPrompt, 'judge');
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [messages, mode, isThinking, isEnded]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isThinking || isFetchingRef.current || isEnded) return;

        const newMessages = [...messages, { role: 'you', content: inputText }];
        setMessages(newMessages);
        setInputText("");
        isAtBottomRef.current = true;

        if (checkEnd(newMessages)) return;

        await fetchStream("/api/judge", newMessages, extraPrompt, 'judge');
    };

    const handleBack = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        onRestart();
    };

    return (
        <div className="flex flex-col w-screen h-screen font-sans overflow-hidden relative bg-[#050505]">

            <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                    background: isMobile
                        ? 'linear-gradient(to bottom, rgba(80, 10, 10, 0.4) 0%, rgba(5, 5, 5, 0.9) 50%, rgba(10, 60, 80, 0.4) 100%)'
                        : 'linear-gradient(to right, rgba(80, 10, 10, 0.4) 0%, rgba(5, 5, 5, 0.9) 50%, rgba(10, 60, 80, 0.4) 100%)'
                }}
            ></div>

            <div className="relative z-20 flex flex-col items-center justify-center w-full py-3 md:py-4 bg-black/40 backdrop-blur-xl border-b border-red-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] px-4">

                <button
                    onClick={handleBack}
                    title="终止对话并返回大厅"
                    className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2 text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                >
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="hidden md:inline text-xs font-bold tracking-widest uppercase">返回大厅</span>
                </button>

                <div className="flex items-center gap-2 text-red-500/80 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-1">
                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                    <span>CRITICAL SITUATION</span>
                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="text-gray-100 text-sm md:text-lg font-bold tracking-widest text-center truncate w-full max-w-2xl lg:max-w-4xl drop-shadow-md">
                    {data.C}
                </div>
            </div>

            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-10 scrollbar-hide z-10 pt-6"
            >
                {messages.map((msg, idx) => {
                    const isJudge = msg.role === 'judge';
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                            className={`flex w-full ${isJudge ? 'justify-start' : 'justify-end'}`}
                        >
                            <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isJudge ? 'items-start' : 'items-end'}`}>
                                <span className={`text-xs md:text-sm mb-1 md:mb-2 tracking-widest uppercase font-black ${isJudge ? 'text-red-500/80 ml-2' : 'text-cyan-500/80 mr-2'}`}>
                                    {isJudge ? data.A : data.B}
                                </span>

                                <div
                                    className={`px-5 py-4 md:px-6 md:py-5 text-base md:text-xl tracking-wide leading-relaxed shadow-2xl backdrop-blur-md min-h-[50px] ${msg.isError ? 'bg-red-900/90 text-white border-2 border-red-500 rounded-3xl' :
                                        isJudge
                                            ? 'bg-[#2a0808]/80 text-red-100 border border-red-800/50 rounded-2xl md:rounded-3xl rounded-tl-none shadow-[0_10px_40px_rgba(220,38,38,0.2)]'
                                            : 'bg-[#081a20]/80 text-cyan-50 border border-cyan-800/50 rounded-2xl md:rounded-3xl rounded-tr-none shadow-[0_10px_40px_rgba(6,182,212,0.2)]'
                                        }`}
                                >
                                    <span className="whitespace-pre-wrap">{msg.content}</span>
                                    {isThinking && idx === messages.length - 1 && !msg.isError && (
                                        <span className="inline-block w-2 h-5 ml-1 bg-current animate-pulse align-middle"></span>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} className="h-6" />
            </div>

            <div className="relative z-10 w-full p-4 md:p-6 border-t border-white/5 bg-black/20 backdrop-blur-xl">
                {isEnded ? (
                    <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-5xl mx-auto py-2">
                        <div className="flex items-center gap-3 text-red-500 mb-4 md:mb-0 animate-pulse">
                            <AlertTriangle className="w-6 h-6" />
                            {/* 文案修改：法官 -> 对手 */}
                            <span className="font-black tracking-widest text-lg md:text-xl uppercase">
                                {messages.length > 0 && messages[messages.length - 1].isError ? "系统崩溃 · 对线异常终止" : "对手已被气晕 · 对线终止"}
                            </span>
                        </div>
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest uppercase rounded-full transition-all border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            <RotateCcw className="w-5 h-5" /> 返回大厅重启
                        </button>
                    </div>
                ) : isThinking ? (
                    <div className="flex justify-center items-center text-gray-400 space-x-3 py-3 md:py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                        <span className="tracking-[0.2em] md:tracking-[0.3em] text-sm md:text-lg uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-cyan-500 animate-pulse">
                            AI 血压飙升输入中...
                        </span>
                    </div>
                ) : mode === 'HALF' ? (
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto relative flex items-center">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="坚决不认错，开始你的狡辩..."
                            className="w-full bg-white/5 border border-white/10 rounded-full pl-6 md:pl-8 pr-16 md:pr-20 py-4 md:py-5 text-white text-base md:text-xl focus:outline-none focus:border-cyan-700 focus:bg-white/10 transition-all placeholder:text-gray-500 shadow-inner"
                        />
                        <button
                            type="submit"
                            disabled={!inputText.trim() || isFetchingRef.current}
                            className="absolute right-2 md:right-3 bg-gradient-to-r from-cyan-700/80 to-cyan-500/80 hover:from-cyan-600 hover:to-cyan-400 text-white p-3 md:p-4 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)] backdrop-blur-md"
                        >
                            <Send className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </form>
                ) : (
                    <div className="flex justify-center items-center text-cyan-500/70 space-x-3 py-3 md:py-4">
                        <Cpu className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="tracking-[0.2em] md:tracking-[0.3em] text-sm md:text-lg uppercase font-bold">回合结束，准备下一轮...</span>
                    </div>
                )}
            </div>

        </div>
    );
}