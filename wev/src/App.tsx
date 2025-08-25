import { useState, useEffect } from 'react';
import AvatarCanvas from './components/AvatarCanvas';
import UIControls from './components/UIControls';
import './App.css';

function App() {
  const [showUI, setShowUI] = useState(true);
  const [fps, setFPS] = useState<number>(0);

  // Spaceキーでの UI表示/非表示切り替え
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setShowUI(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      {/* メインキャンバス - Green Background */}
      <AvatarCanvas onFPSUpdate={setFPS} />
      
      {/* UI表示時のコントロール */}
      {showUI && (
        <UIControls 
          fps={fps}
          onToggleUI={() => setShowUI(!showUI)}
        />
      )}
      
      {/* UI非表示時のヘルプテキスト */}
      {!showUI && (
        <div className="help-text">
          Press SPACE to show/hide UI
        </div>
      )}
    </div>
  );
}

export default App;