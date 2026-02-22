import { useState } from 'react';
import Landing from './components/Landing';
import TheaterIntro from './components/TheaterIntro';
import ChatRoom from './components/ChatRoom';
import AdminDashboard from './components/AdminDashboard'; // 引入大屏
import { Loader2 } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState('START');

  const [mode, setMode] = useState(null);
  const [persona, setPersona] = useState(null);
  const [extraPrompt, setExtraPrompt] = useState("");
  const [apiConfig, setApiConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleModeSelect = async (selectedMode, userExtraPrompt, config) => {
    setMode(selectedMode);
    setExtraPrompt(userExtraPrompt);
    setApiConfig(config);
    setIsLoading(true);

    try {
      const response = await fetch("/api/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config })
      });
      const data = await response.json();
      setPersona(data);
      setAppState('INTRO');
    } catch (error) {
      alert("后端连接失败！请确认后端正在运行，且 API 配置正确。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleIntroComplete = () => {
    setAppState('BATTLE');
  };

  const handleRestart = () => {
    setAppState('START');
    setPersona(null);
  };

  return (
    <>
      {appState === 'START' && (
        <div className="relative">
          <Landing
            onSelect={handleModeSelect}
            onGoAdmin={() => setAppState('ADMIN')} // 进入数据大屏
          />
          {isLoading && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
              <p className="text-white text-xl tracking-widest font-bold animate-pulse">系统正在生成剧本...</p>
            </div>
          )}
        </div>
      )}

      {appState === 'INTRO' && persona && (
        <TheaterIntro
          persona={persona}
          onComplete={handleIntroComplete}
          onBack={handleRestart}
        />
      )}

      {appState === 'BATTLE' && persona && (
        <ChatRoom
          mode={mode}
          persona={persona}
          extraPrompt={extraPrompt}
          apiConfig={apiConfig}
          onRestart={handleRestart}
        />
      )}

      {/* 渲染数据大屏 */}
      {appState === 'ADMIN' && (
        <AdminDashboard onBack={handleRestart} />
      )}
    </>
  );
}

export default App;