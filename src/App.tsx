import React, { useState } from 'react';
import Game from './components/Game';
import ConnectionTest from './components/ConnectionTest';
import './App.css';

function App() {
  const [showTest, setShowTest] = useState(false);

  return (
    <div className="App">
      <header className="App-header">
        <h1>大炮轰小兵</h1>
        {/* <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setShowTest(!showTest)}
            style={{
              background: showTest ? '#dc3545' : '#007bff',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {showTest ? '🎮 返回游戏' : '🔧 连接测试'}
          </button>
        </div> */}
      </header>
      <main>
        {showTest ? <ConnectionTest /> : <Game />}
      </main>
      <footer className="App-footer">
        <p>© 2025 大炮轰小兵 - 经典中国棋类游戏</p>
      </footer>
    </div>
  );
}

export default App;
