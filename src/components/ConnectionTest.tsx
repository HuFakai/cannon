import React, { useState, useRef } from 'react';
import { ConnectionStatus, MessageType } from '../types/online';

interface ConnectionInfo {
  id: number;
  status: string;
  playerId?: string;
  playerType?: string;
  playersCount?: number;
  log: string[];
}

const ConnectionTest: React.FC = () => {
  const [connections, setConnections] = useState<Map<number, ConnectionInfo>>(new Map());
  const [roomId, setRoomId] = useState('TEST123');
  const wsRefs = useRef<Map<number, any>>(new Map());

  const addLog = (connId: number, message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    
    setConnections(prev => {
      const newMap = new Map(prev);
      const conn = newMap.get(connId);
      if (conn) {
        conn.log = [...conn.log, logEntry];
        newMap.set(connId, { ...conn });
      }
      return newMap;
    });
  };

  const updateStatus = (connId: number, status: string, data?: any) => {
    setConnections(prev => {
      const newMap = new Map(prev);
      const conn = newMap.get(connId) || { id: connId, status: '', log: [] };
      newMap.set(connId, {
        ...conn,
        status,
        ...data
      });
      return newMap;
    });
  };

  const createConnection = async (connId: number) => {
    if (wsRefs.current.has(connId)) {
      wsRefs.current.get(connId)?.disconnect?.();
    }

    addLog(connId, '🔄 创建新连接...', 'info');
    updateStatus(connId, '连接中...');

    try {
      // 动态导入WebSocketManager类并创建新实例
      const { WebSocketManager } = await import('../utils/websocket');
      const ws = new WebSocketManager();
      wsRefs.current.set(connId, ws);

      // 监听连接状态
      ws.onConnectionStatusChange((status: ConnectionStatus) => {
        addLog(connId, `连接状态: ${status}`, status === ConnectionStatus.CONNECTED ? 'success' : 'info');
        updateStatus(connId, status);
      });

      // 监听消息
      ws.on(MessageType.ROOM_JOINED, (message: any) => {
        addLog(connId, `🏠 加入房间: ${message.playerType} (${message.playerId})`, 'success');
        updateStatus(connId, '已连接', {
          playerId: message.playerId,
          playerType: message.playerType,
          playersCount: message.playersCount
        });
      });

      ws.on(MessageType.PLAYER_JOINED, (message: any) => {
        addLog(connId, `👥 玩家加入: ${message.playersCount}/2`, 'info');
        updateStatus(connId, '已连接', { playersCount: message.playersCount });
      });

      ws.on(MessageType.GAME_START, () => {
        addLog(connId, '🎮 游戏开始!', 'success');
      });

      ws.on(MessageType.GAME_UPDATE, () => {
        addLog(connId, '🔄 游戏状态更新', 'info');
      });

      ws.on(MessageType.ERROR, (message: any) => {
        addLog(connId, `❌ 错误: ${message.message}`, 'error');
      });

      // 连接到服务器
      await ws.connect();
      
      // 加入房间
      const playerName = `测试玩家${connId}_${Date.now()}`;
      ws.joinRoom(roomId, playerName);
      addLog(connId, `📤 加入房间: ${roomId}`, 'info');

    } catch (error) {
      addLog(connId, `❌ 连接失败: ${error}`, 'error');
      updateStatus(connId, '连接失败');
    }
  };

  const disconnect = (connId: number) => {
    const ws = wsRefs.current.get(connId);
    if (ws) {
      ws.disconnect();
      wsRefs.current.delete(connId);
      addLog(connId, '🔌 断开连接', 'info');
      updateStatus(connId, '已断开');
    }
  };

  const connectBoth = async () => {
    addLog(1, '=== 开始双连接测试 ===', 'success');
    addLog(2, '=== 开始双连接测试 ===', 'success');
    
    await createConnection(1);
    
    setTimeout(() => {
      createConnection(2);
    }, 1000);
  };

  const clearLogs = () => {
    setConnections(new Map());
  };

  const renderConnection = (connId: number) => {
    const conn = connections.get(connId) || { id: connId, status: '未连接', log: [] };
    
    return (
      <div key={connId} style={{
        display: 'inline-block',
        width: '45%',
        margin: '10px',
        padding: '20px',
        background: '#f5f5f5',
        borderRadius: '10px',
        verticalAlign: 'top'
      }}>
        <h3>🔴 连接 {connId} {conn.playerType ? `(${conn.playerType})` : ''}</h3>
        
        <div style={{
          padding: '10px',
          margin: '10px 0',
          borderRadius: '5px',
          textAlign: 'center',
          background: conn.status.includes('连接') ? '#d4edda' : '#f8d7da',
          color: conn.status.includes('连接') ? '#155724' : '#721c24'
        }}>
          {conn.status}
          {conn.playersCount && ` - 玩家: ${conn.playersCount}/2`}
        </div>

        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={() => createConnection(connId)}
            style={{
              background: '#007bff',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '5px',
              margin: '5px',
              cursor: 'pointer'
            }}
          >
            连接
          </button>
          <button 
            onClick={() => disconnect(connId)}
            style={{
              background: '#dc3545',
              color: 'white',
              padding: '8px 15px',
              border: 'none',
              borderRadius: '5px',
              margin: '5px',
              cursor: 'pointer'
            }}
          >
            断开
          </button>
        </div>

        <div style={{
          background: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '5px',
          padding: '10px',
          height: '200px',
          overflowY: 'auto',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          {conn.log.map((entry, index) => (
            <div key={index} style={{ marginBottom: '2px' }}>
              {entry}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>🎮 WebSocket连接测试</h1>
      
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="房间ID"
          style={{
            padding: '10px',
            margin: '5px',
            borderRadius: '5px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={connectBoth}
          style={{
            background: '#28a745',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            margin: '5px',
            cursor: 'pointer'
          }}
        >
          🚀 连接两个玩家
        </button>
        <button
          onClick={clearLogs}
          style={{
            background: '#6c757d',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            margin: '5px',
            cursor: 'pointer'
          }}
        >
          清空日志
        </button>
      </div>

      <div>
        {renderConnection(1)}
        {renderConnection(2)}
      </div>
    </div>
  );
};

export default ConnectionTest; 