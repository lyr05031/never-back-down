import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Cpu, Loader2, AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';

// 接收 prompts 对象
export default function ChatRoom({ mode, userRole, persona, prompts, apiConfig, onRestart }) {
    const data = persona || { A: "", B: "", C: "" };

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [isEnded, setIsEnded] = useState(false);

    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const isAtBottomRef = useRef(true);

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

    // 【核心简化】：直接根据当前要生成的角色，自动选取对应的 Prompt
    const fetchStream = async (url, historyToSent, roleToAppend) => {
        if (isFetchingRef.current || isEnded) return;
        isFetchingRef.current = true;
        setIsThinking(true);

        // 如果是让法官发言，塞红方 Prompt；如果是让狡辩者发言，塞蓝方 Prompt
        const currentExtraPrompt = roleToAppend === 'judge' ? prompts.redPrompt : prompts.bluePrompt;

        setMessages(prev => [...prev, { role: roleToAppend, content: "", isError: false }]);
        abortControllerRef.current = new AbortController();

        try {
            const cleanHistory = historyToSent.map(msg => ({ role: msg.role, content: msg.content }));

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
                setMessages(prev => {
                    const newMsgs = [...prev];
                    const lastIndex = newMsgs.length - 1;
                    newMsgs[lastIndex] = { ...newMsgs[lastIndex], content: newMsgs[lastIndex].content + `\n\n🚨 前端连接崩溃！原因：${e.message}`, isError: true };
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
                        newMsgs[newMsgs.length - 1] = { ...lastMsg, content: "🚨 API拒绝输出(可能触发了安全拦截)", isError: true };
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
        if (mode === 'AUTO' && msgs.length >= 12 && !isEnded) {
            setIsEnded(true);
            return true;
        }
        return false;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (messages.length === 0 && !isFetchingRef.current && !isEnded) {
                isAtBottomRef.current = true;
                if (mode === 'AUTO') {
                    fetchStream("/api/judge", [], 'judge');
                } else {
                    if (userRole === 'partner') fetchStream("/api/judge", [], 'judge');
                    else setIsThinking(false);
                }
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [mode, userRole]);

    useEffect(() => {
        if (isEnded) return;
        if (messages.length === 0 || isThinking || isFetchingRef.current) return;
        if (checkEnd(messages)) return;

        const lastMsg = messages[messages.length - 1];
        if (!lastMsg || !lastMsg.content.trim() || lastMsg.isError) return;

        if (mode === 'AUTO') {
            const timer = setTimeout(() => {
                if (lastMsg.role === 'judge') fetchStream("/api/partner", messages, 'you');
                else fetchStream("/api/judge", messages, 'judge');
            }, 1000);
            return () => clearTimeout(timer);
        }
        else if (lastMsg.role === userRole) {
            const timer = setTimeout(() => {
                if (userRole === 'judge') fetchStream("/api/partner", messages, 'you');
                else fetchStream("/api/judge", messages, 'judge');
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [messages, mode, isThinking, isEnded, userRole]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isThinking || isFetchingRef.current || isEnded) return;

        const newMessages = [...messages, { role: userRole, content: inputText }];
        setMessages(newMessages);
        setInputText("");
        isAtBottomRef.current = true;

        checkEnd(newMessages);
    };

    const handleBack = () => {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        onRestart();
    };

    const bgGradient = 'linear-gradient(to right, rgba(10, 60, 80, 0.4) 0%, rgba(5, 5, 5, 0.9) 50%, rgba(80, 10, 10, 0.4) 100%)';

    const isJudgeThinking = messages.length > 0 && messages[messages.length - 1].role === 'judge';
    const inputColor = userRole === 'judge' ? "focus:border-red-700" : "focus:border-cyan-700";
    const btnColor = userRole === 'judge'
        ? "from-red-700/80 to-red-500/80 hover:from-red-600 hover:to-red-400 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
        : "from-cyan-700/80 to-cyan-500/80 hover:from-cyan-600 hover:to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
    const placeholderTxt = userRole === 'judge'
        ? `你是施压者【${data.A}】，开始你的愤怒输出！`
        : `你是【${data.B}】，坚决不认错，开始狡辩！`;

    return (
        <div className="flex flex-col w-screen h-[100dvh] font-sans overflow-hidden relative bg-[#050505]">
            <div className="absolute inset-0 pointer-events-none z-0" style={{ background: bgGradient }}></div>

            <div className="relative z-20 flex-shrink-0 flex flex-col items-center justify-center w-full py-3 md:py-4 bg-black/60 backdrop-blur-xl border-b border-red-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] px-14 md:px-24">
                <button onClick={handleBack} className="absolute left-2 md:left-6 top-3 md:top-1/2 md:-translate-y-1/2 flex items-center gap-1 md:gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 z-50">
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                    <span className="hidden md:inline text-xs font-bold tracking-widest uppercase">返回大厅</span>
                </button>
                <div className="flex items-center gap-2 text-red-500/80 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase mb-1">
                    <AlertTriangle className="w-3 h-3 md:w-4 md:h-4" /><span>CRITICAL SITUATION</span><AlertTriangle className="w-3 h-3 md:w-4 md:h-4" />
                </div>
                <div className="text-gray-100 text-xs md:text-lg font-bold tracking-widest text-center break-words w-full max-w-2xl lg:max-w-4xl drop-shadow-md">
                    {data.C}
                </div>
            </div>

            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 md:space-y-10 scrollbar-hide z-10 pt-6">
                {messages.map((msg, idx) => {
                    const isJudgeRole = msg.role === 'judge';
                    const isRight = isJudgeRole;

                    const bubbleColor = isJudgeRole
                        ? 'bg-[#2a0808]/80 text-red-100 border border-red-800/50 shadow-[0_10px_40px_rgba(220,38,38,0.2)]'
                        : 'bg-[#081a20]/80 text-cyan-50 border border-cyan-800/50 shadow-[0_10px_40px_rgba(6,182,212,0.2)]';

                    const bubbleShape = isRight ? 'rounded-2xl md:rounded-3xl rounded-tr-none' : 'rounded-2xl md:rounded-3xl rounded-tl-none';
                    const nameColor = isJudgeRole ? 'text-red-500/80' : 'text-cyan-500/80';
                    const nameAlign = isRight ? 'text-right mr-2' : 'text-left ml-2';

                    let displayName = isJudgeRole ? data.A : data.B;
                    if (mode === 'HALF' && msg.role === userRole) displayName += " (你)";

                    return (
                        <motion.div key={idx} initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className={`flex w-full ${isRight ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isRight ? 'items-end' : 'items-start'}`}>
                                <span className={`text-[10px] md:text-sm mb-1 md:mb-2 tracking-widest uppercase font-black break-words leading-tight ${nameColor} ${nameAlign}`}>
                                    {displayName}
                                </span>
                                <div className={`px-5 py-4 md:px-6 md:py-5 text-base md:text-xl tracking-wide leading-relaxed shadow-2xl backdrop-blur-md min-h-[50px] ${msg.isError ? 'bg-red-900/90 text-white border-2 border-red-500 rounded-3xl' : `${bubbleColor} ${bubbleShape}`}`}>
                                    <span className="whitespace-pre-wrap">{msg.content}</span>
                                    {isThinking && idx === messages.length - 1 && !msg.isError && <span className="inline-block w-2 h-5 ml-1 bg-current animate-pulse align-middle"></span>}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
                <div ref={messagesEndRef} className="h-6" />
            </div>

            <div className="relative z-10 flex-shrink-0 w-full p-4 md:p-6 border-t border-white/5 bg-black/40 backdrop-blur-xl">
                {isEnded ? (
                    <div className="flex flex-col md:flex-row justify-between items-center w-full max-w-5xl mx-auto py-2">
                        <div className="flex items-center gap-3 text-red-500 mb-4 md:mb-0 animate-pulse">
                            <AlertTriangle className="w-6 h-6" />
                            <span className="font-black tracking-widest text-lg md:text-xl uppercase">
                                {messages.length > 0 && messages[messages.length - 1].isError ? "系统崩溃 · 对线异常终止" : "对战已结束 · 轮数上限（六轮）"}
                            </span>
                        </div>
                        <button onClick={handleBack} className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold tracking-widest uppercase rounded-full transition-all border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                            <RotateCcw className="w-5 h-5" /> 返回大厅重启
                        </button>
                    </div>
                ) : isThinking ? (
                    <div className="flex justify-center items-center space-x-3 py-3 md:py-4">
                        <Loader2 className={`w-6 h-6 animate-spin ${isJudgeThinking ? 'text-red-500' : 'text-cyan-500'}`} />
                        <span className={`tracking-[0.2em] md:tracking-[0.3em] text-sm md:text-lg uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r ${isJudgeThinking ? 'from-red-600 to-red-400' : 'from-cyan-500 to-cyan-300'} animate-pulse`}>
                            {isJudgeThinking ? '对手血压飙升输入中...' : '狡辩方疯狂打字中...'}
                        </span>
                    </div>
                ) : mode === 'HALF' ? (
                    <form onSubmit={handleSend} className="max-w-5xl mx-auto relative flex items-center">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={placeholderTxt}
                            className={`w-full bg-white/5 border border-white/10 rounded-full pl-6 md:pl-8 pr-16 md:pr-20 py-4 md:py-5 text-white text-base md:text-xl focus:outline-none focus:bg-white/10 transition-all placeholder:text-gray-500 shadow-inner ${inputColor}`}
                        />
                        <button type="submit" disabled={!inputText.trim() || isFetchingRef.current} className={`absolute right-2 md:right-3 text-white p-3 md:p-4 rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-gradient-to-r ${btnColor}`}>
                            <Send className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                    </form>
                ) : (
                    <div className="flex justify-center items-center text-gray-500 space-x-3 py-3 md:py-4">
                        <Cpu className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="tracking-[0.2em] md:tracking-[0.3em] text-sm md:text-lg uppercase font-bold">准备下一轮...</span>
                    </div>
                )}
            </div>

        </div>
    );
}