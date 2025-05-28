import React, { useState, useEffect, useCallback } from 'react';
import Board from './Board';
import GameInfo from './GameInfo';
import GameRules from './GameRules';
import { GameState, Position, PlayerType, PieceType } from '../types/game';
import { ConnectionStatus, MessageType, OnlineGameState } from '../types/online';
import { 
  initializeGame, 
  getCannonValidMoves, 
  getSoldierValidMoves,
  getCannonCaptures,
  movePiece
} from '../utils/gameUtils';
import { wsManager } from '../utils/websocket';
import '../styles/Game.css';

const Game: React.FC = () => {
  // 游戏状态
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  
  // 联机状态
  const [onlineState, setOnlineState] = useState<OnlineGameState>({
    isOnline: false,
    connectionStatus: ConnectionStatus.DISCONNECTED,
    roomId: '',
    playerId: '',
    playerType: null,
    isHost: false,
    playersCount: 0,
    ws: null
  });

  // 处理连接状态变化
  const handleConnectionStatusChange = useCallback((status: ConnectionStatus) => {
    setOnlineState(prev => ({ ...prev, connectionStatus: status }));
  }, []);

  // 处理WebSocket消息
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('客户端收到WebSocket消息:', message.type, message);
    
    switch (message.type) {
      case MessageType.ROOM_JOINED:
        setOnlineState(prev => ({
          ...prev,
          isOnline: true,
          roomId: message.roomId,
          playerId: message.playerId,
          playerType: message.playerType,
          isHost: message.isHost || false,
          playersCount: message.playersCount || 1
        }));
        console.log('加入房间成功，玩家ID:', message.playerId, '玩家类型:', message.playerType, '玩家数量:', message.playersCount);
        break;
        
      case MessageType.PLAYER_JOINED:
        setOnlineState(prev => ({
          ...prev,
          playersCount: message.playersCount
        }));
        console.log('有新玩家加入，当前玩家数:', message.playersCount);
        break;
        
      case MessageType.GAME_START:
        console.log('游戏开始，设置初始状态:', message.gameState);
        // 确保游戏状态有效
        if (message.gameState && message.gameState.board) {
          setGameState(message.gameState);
        } else {
          console.error('收到无效的游戏状态:', message.gameState);
        }
        break;
        
      case MessageType.GAME_UPDATE:
        console.log('收到游戏状态更新:', {
          currentPlayer: message.gameState.currentPlayer,
          cannonCount: message.gameState.cannonPieces.length,
          soldierCount: message.gameState.soldierPieces.length
        });
        // 确保游戏状态有效
        if (message.gameState && message.gameState.board) {
          setGameState(message.gameState);
        } else {
          console.error('收到无效的游戏状态更新:', message.gameState);
        }
        break;
        
      case MessageType.GAME_OVER:
        console.log('游戏结束:', message);
        // 显示胜利信息
        const winnerText = message.winner === 'cannon' ? '大炮玩家' : '小兵玩家';
        const reasonText = message.reason === '小兵数量不足' ? '小兵数量不足6个' : '大炮被围困无法移动';
        setTimeout(() => {
          alert(`🎉 游戏结束！\n胜利者：${winnerText}\n胜利原因：${reasonText}`);
        }, 500);
        break;
        
      case MessageType.GAME_RESTART:
        console.log('游戏重新开始:', message.gameState);
        if (message.gameState && message.gameState.board) {
          setGameState(message.gameState);
          alert('🎮 游戏已重新开始！');
        }
        break;
        
      case MessageType.PLAYER_LEFT:
        setOnlineState(prev => ({
          ...prev,
          playersCount: Math.max(0, prev.playersCount - 1)
        }));
        break;
        
      case MessageType.ERROR:
        console.error('WebSocket错误:', message.message);
        alert(`错误: ${message.message}`);
        break;
    }
  }, []);

  // 初始化WebSocket事件监听
  useEffect(() => {
    wsManager.onConnectionStatusChange(handleConnectionStatusChange);
    wsManager.on(MessageType.ROOM_JOINED, handleWebSocketMessage);
    wsManager.on(MessageType.PLAYER_JOINED, handleWebSocketMessage);
    wsManager.on(MessageType.GAME_START, handleWebSocketMessage);
    wsManager.on(MessageType.GAME_UPDATE, handleWebSocketMessage);
    wsManager.on(MessageType.GAME_OVER, handleWebSocketMessage);
    wsManager.on(MessageType.GAME_RESTART, handleWebSocketMessage);
    wsManager.on(MessageType.PLAYER_LEFT, handleWebSocketMessage);
    wsManager.on(MessageType.ERROR, handleWebSocketMessage);

    return () => {
      wsManager.offConnectionStatusChange(handleConnectionStatusChange);
      wsManager.off(MessageType.ROOM_JOINED, handleWebSocketMessage);
      wsManager.off(MessageType.PLAYER_JOINED, handleWebSocketMessage);
      wsManager.off(MessageType.GAME_START, handleWebSocketMessage);
      wsManager.off(MessageType.GAME_UPDATE, handleWebSocketMessage);
      wsManager.off(MessageType.GAME_OVER, handleWebSocketMessage);
      wsManager.off(MessageType.GAME_RESTART, handleWebSocketMessage);
      wsManager.off(MessageType.PLAYER_LEFT, handleWebSocketMessage);
      wsManager.off(MessageType.ERROR, handleWebSocketMessage);
    };
  }, [handleConnectionStatusChange, handleWebSocketMessage]);

  // 处理单元格点击
  const handleCellClick = (position: Position) => {
    const { 
      board, 
      currentPlayer, 
      selectedPiece, 
      validMoves,
      gameOver 
    } = gameState;
    
    // 如果游戏已结束，不做任何处理
    if (gameOver) return;
    
    // 在联机模式下，检查是否轮到当前玩家
    if (onlineState.isOnline && onlineState.playerType !== currentPlayer) {
      console.log('不是当前玩家的回合', {
        currentPlayer,
        playerType: onlineState.playerType
      });
      return; // 不是当前玩家的回合
    }
    
    const clickedPiece = board[position.row][position.col];
    
    // 如果没有选中棋子，并且点击了当前玩家的棋子
    if (
      !selectedPiece && 
      clickedPiece && 
      ((currentPlayer === PlayerType.CANNON && clickedPiece.type === PieceType.CANNON) ||
       (currentPlayer === PlayerType.SOLDIER && clickedPiece.type === PieceType.SOLDIER))
    ) {
      // 选中棋子
      const newGameState = { ...gameState };
      clickedPiece.isSelected = true;
      newGameState.selectedPiece = clickedPiece;
      
      // 计算有效移动
      if (clickedPiece.type === PieceType.CANNON) {
        newGameState.validMoves = getCannonValidMoves(newGameState, clickedPiece);
        
        // 检查是否可以吃子
        const captures = getCannonCaptures(newGameState, clickedPiece.position);
        newGameState.validMoves = [...newGameState.validMoves, ...captures];
      } else {
        newGameState.validMoves = getSoldierValidMoves(newGameState, clickedPiece);
      }
      
      setGameState(newGameState);
      console.log('选中棋子:', clickedPiece, '有效移动:', newGameState.validMoves);
    }
    // 如果已选中棋子，并且点击了有效移动位置
    else if (
      selectedPiece && 
      validMoves.some(move => move.row === position.row && move.col === position.col)
    ) {
      console.log('执行移动:', selectedPiece.position, ' -> ', position);
      
      // 如果是联机模式，发送移动到服务器
      if (onlineState.isOnline) {
        wsManager.sendMove(selectedPiece.position, position, onlineState.playerId);
      } else {
        // 单机模式，直接执行移动
        const newGameState = movePiece(gameState, selectedPiece, position);
        setGameState(newGameState);
      }
    }
    // 如果已选中棋子，但点击了无效位置，取消选择
    else if (selectedPiece) {
      const newGameState = { ...gameState };
      selectedPiece.isSelected = false;
      newGameState.selectedPiece = null;
      newGameState.validMoves = [];
      setGameState(newGameState);
      console.log('取消选择');
    }
  };
  
  // 重新开始游戏
  const handleRestart = () => {
    if (onlineState.isOnline && onlineState.playerId) {
      // 联机模式下通知服务器重新开始
      wsManager.restartGame(onlineState.playerId);
    } else {
      setGameState(initializeGame());
    }
  };

  // 加入房间
  const handleJoinRoom = async (roomId: string) => {
    try {
      // 如果未连接，先连接WebSocket
      if (onlineState.connectionStatus !== ConnectionStatus.CONNECTED) {
        await wsManager.connect();
      }
      
      // 生成唯一的玩家名称
      const playerName = `玩家_${Date.now()}_${Math.floor(Math.random() * 100)}`;
      
      // 加入房间
      wsManager.joinRoom(roomId, playerName);
    } catch (error) {
      console.error('加入房间失败:', error);
      alert('无法连接到服务器，联机功能暂时不可用');
    }
  };

  // 断开连接
  const handleDisconnect = () => {
    wsManager.disconnect();
    setOnlineState({
      isOnline: false,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      roomId: '',
      playerId: '',
      playerType: null,
      isHost: false,
      playersCount: 0,
      ws: null
    });
    // 回到单机模式
    setGameState(initializeGame());
  };

  return (
    <div className="game">
      <div className="game-left-panel">
        <GameInfo 
          gameState={gameState} 
          onRestart={handleRestart}
          connectionStatus={onlineState.connectionStatus}
          isOnline={onlineState.isOnline}
          roomId={onlineState.roomId}
          playersCount={onlineState.playersCount}
          playerType={onlineState.playerType}
          onJoinRoom={handleJoinRoom}
          onDisconnect={handleDisconnect}
        />
      </div>
      <div className="game-main-content">
        <Board gameState={gameState} onCellClick={handleCellClick} />
        <GameRules />
      </div>
    </div>
  );
};

export default Game; 