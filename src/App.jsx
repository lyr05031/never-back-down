import { useState } from 'react';
import Landing from './components/Landing';
import TheaterIntro from './components/TheaterIntro';
import ChatRoom from './components/ChatRoom';
import AdminDashboard from './components/AdminDashboard';
import { Loader2 } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState('START');

  const [mode, setMode] = useState(null);
  const [persona, setPersona] = useState(null);
  // 【修改】：使用对象保存双向 Prompt
  const [prompts, setPrompts] = useState({ bluePrompt: "", redPrompt: "" });
  const [apiConfig, setApiConfig] = useState(null);
  const [userRole, setUserRole] = useState('judge');
  const [isLoading, setIsLoading] = useState(false);

  // 接收 Landing 传来的 {bluePrompt, redPrompt}
  const handleModeSelect = async (selectedMode, userPrompts, config, role) => {
    setMode(selectedMode);
    setPrompts(userPrompts);
    setApiConfig(config);
    setUserRole(role || 'judge');
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
            onGoAdmin={() => setAppState('ADMIN')}
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
          mode={mode}
          userRole={userRole}
          persona={persona}
          onComplete={handleIntroComplete}
          onBack={handleRestart}
        />
      )}

      {appState === 'BATTLE' && persona && (
        <ChatRoom
          mode={mode}
          userRole={userRole}
          persona={persona}
          prompts={prompts} // 【传入双向 Prompt】
          apiConfig={apiConfig}
          onRestart={handleRestart}
        />
      )}

      {appState === 'ADMIN' && (
        <AdminDashboard onBack={handleRestart} />
      )}
    </>
  );
}

export default App;