import React, { useState } from 'react';
import { PlayerType, GameState } from '../types/game';
import { ConnectionStatus } from '../types/online';
import '../styles/GameInfo.css';

interface GameInfoProps {
  gameState: GameState;
  onRestart: () => void;
  // 联机功能相关
  connectionStatus: ConnectionStatus;
  isOnline: boolean;
  roomId: string;
  playersCount: number;
  playerType?: PlayerType | null; // 添加玩家类型属性
  onJoinRoom: (roomId: string) => void;
  onDisconnect: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ 
  gameState, 
  onRestart,
  connectionStatus,
  isOnline,
  roomId,
  playersCount,
  playerType,
  onJoinRoom,
  onDisconnect
}) => {
  const { currentPlayer, gameOver, winner, cannonPieces, soldierPieces } = gameState;
  const [inputRoomId, setInputRoomId] = useState('');
  
  // 获取当前玩家显示名称
  const getCurrentPlayerName = (): string => {
    return currentPlayer === PlayerType.CANNON ? '大炮玩家' : '小兵玩家';
  };
  
  // 获取胜利者显示名称
  const getWinnerName = (): string => {
    if (!winner) return '';
    return winner === PlayerType.CANNON ? '大炮玩家' : '小兵玩家';
  };

  // 获取连接状态显示
  const getConnectionStatusText = (): string => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return '已连接';
      case ConnectionStatus.CONNECTING:
        return '连接中...';
      case ConnectionStatus.DISCONNECTED:
        return '未连接';
      case ConnectionStatus.ERROR:
        return '连接错误';
      default:
        return '未知状态';
    }
  };

  // 获取连接状态样式类
  const getConnectionStatusClass = (): string => {
    switch (connectionStatus) {
      case ConnectionStatus.CONNECTED:
        return 'status-connected';
      case ConnectionStatus.CONNECTING:
        return 'status-connecting';
      case ConnectionStatus.DISCONNECTED:
      case ConnectionStatus.ERROR:
        return 'status-disconnected';
      default:
        return 'status-disconnected';
    }
  };

  // 处理加入房间
  const handleJoinRoom = () => {
    if (inputRoomId.trim()) {
      onJoinRoom(inputRoomId.trim());
    }
  };

  // 生成随机房间ID
  const generateRoomId = () => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInputRoomId(randomId);
  };

  // 获取玩家类型显示
  const getPlayerTypeText = (): string => {
    if (!playerType) return '';
    return playerType === PlayerType.CANNON ? '大炮玩家' : '小兵玩家';
  };

  return (
    <div className="game-info">
      <h2>炮与兵棋</h2>
      
      {/* 游戏状态 */}
      <div className="status">
        {gameOver ? (
          <div className="game-over">
            <p>游戏结束! {getWinnerName()} 胜利!</p>
          </div>
        ) : (
          <div>
            <p>当前回合: {getCurrentPlayerName()}</p>
            {isOnline && playerType && (
              <p style={{ fontSize: '14px', marginTop: '5px', opacity: 0.8 }}>
                你是: {getPlayerTypeText()}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* 棋子数量 */}
      <div className="pieces-count">
        <p>大炮: {cannonPieces.length}</p>
        <p>小兵: {soldierPieces.length}</p>
      </div>
      
      {/* 联机功能区域 */}
      <div className="online-section">
        <h3>🌐 联机对战</h3>
        
        {/* 连接状态 */}
        <div className={`connection-status ${getConnectionStatusClass()}`}>
          {getConnectionStatusText()}
          {isOnline && roomId && (
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              房间: {roomId} | 玩家: {playersCount}/2
            </div>
          )}
        </div>

        {/* 房间操作 */}
        {!isOnline ? (
          <div>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input
                type="text"
                className="room-input"
                placeholder="输入房间ID"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value.toUpperCase())}
                maxLength={6}
              />
              <button 
                className="online-button"
                onClick={generateRoomId}
                style={{ 
                  width: 'auto', 
                  padding: '8px 12px', 
                  fontSize: '12px',
                  margin: '0'
                }}
              >
                随机
              </button>
            </div>
            
            <button 
              className="online-button"
              onClick={handleJoinRoom}
              disabled={!inputRoomId.trim() || connectionStatus === ConnectionStatus.CONNECTING}
            >
              {connectionStatus === ConnectionStatus.CONNECTING ? '连接中...' : '加入房间'}
            </button>
          </div>
        ) : (
          <button 
            className="online-button"
            onClick={onDisconnect}
            style={{ background: 'var(--warning-gradient)' }}
          >
            离开房间
          </button>
        )}
      </div>
      
      {/* 重新开始按钮 */}
      <button className="restart-button" onClick={onRestart}>
        重新开始
      </button>
    </div>
  );
};

export default GameInfo; 