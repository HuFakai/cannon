const WebSocket = require('ws');

// 房间管理
const rooms = new Map();
let playerCounter = 0;

// 深拷贝函数
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(item => deepClone(item));
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

// 初始化游戏状态
function initializeGame() {
  const board = Array(6).fill(null).map(() => Array(6).fill(null));
  
  // 初始化大炮（第二行第三、四列）
  const cannonPieces = [
    { id: 'cannon-1', type: 'cannon', position: { row: 1, col: 2 }, isSelected: false },
    { id: 'cannon-2', type: 'cannon', position: { row: 1, col: 3 }, isSelected: false }
  ];
  
  // 初始化小兵（第四到六行所有格子）
  const soldierPieces = [];
  for (let row = 3; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      soldierPieces.push({
        id: `soldier-${row}-${col}`,
        type: 'soldier',
        position: { row, col },
        isSelected: false
      });
    }
  }
  
  // 放置棋子到棋盘
  cannonPieces.forEach(piece => {
    board[piece.position.row][piece.position.col] = piece;
  });
  soldierPieces.forEach(piece => {
    board[piece.position.row][piece.position.col] = piece;
  });
  
  return {
    board,
    currentPlayer: 'cannon',
    cannonPieces,
    soldierPieces,
    selectedPiece: null,
    validMoves: [],
    gameOver: false,
    winner: null
  };
}

// 检查大炮是否被围困（只检查相邻位置是否能移动，不考虑吃子）
function canCannonMove(gameState, cannonPiece) {
  const { board } = gameState;
  const { row, col } = cannonPiece.position;
  
  // 检查四个方向（上、下、左、右）
  const directions = [
    { row: -1, col: 0 }, // 上
    { row: 1, col: 0 },  // 下
    { row: 0, col: -1 }, // 左
    { row: 0, col: 1 }   // 右
  ];
  
  for (const dir of directions) {
    const newRow = row + dir.row;
    const newCol = col + dir.col;
    
    // 检查是否在棋盘范围内
    if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 6) {
      const targetCell = board[newRow][newCol];
      
      // 只有相邻位置为空才算可以移动
      if (!targetCell) {
        return true; // 可以移动到相邻空位置
      }
    }
  }
  return false; // 被围困，无法移动到任何相邻位置
}

// 检查所有大炮是否都无法移动
function areAllCannonsSurrounded(gameState) {
  const { cannonPieces } = gameState;
  
  for (const cannon of cannonPieces) {
    if (canCannonMove(gameState, cannon)) {
      return false; // 至少有一个大炮可以移动
    }
  }
  
  return true; // 所有大炮都被围困
}


// 移动棋子逻辑（完整版）
function movePiece(gameState, piece, targetPosition) {
  const newGameState = deepClone(gameState);
  const { board } = newGameState;
  
  // 移除原位置的棋子
  board[piece.position.row][piece.position.col] = null;
  
  // 检查是否吃子
  const targetPiece = board[targetPosition.row][targetPosition.col];
  if (targetPiece && targetPiece.type === 'soldier') {
    // 移除被吃的小兵
    newGameState.soldierPieces = newGameState.soldierPieces.filter(
      s => s.id !== targetPiece.id
    );
  }
  
  // 更新棋子位置 - 需要同时更新棋盘和棋子数组中的位置
  piece.position = targetPosition;
  piece.isSelected = false;
  board[targetPosition.row][targetPosition.col] = piece;
  
  // 同步更新cannonPieces或soldierPieces数组中的位置
  if (piece.type === 'cannon') {
    const cannonInArray = newGameState.cannonPieces.find(c => c.id === piece.id);
    if (cannonInArray) {
      cannonInArray.position = { ...targetPosition };
      cannonInArray.isSelected = false;
    }
  } else if (piece.type === 'soldier') {
    const soldierInArray = newGameState.soldierPieces.find(s => s.id === piece.id);
    if (soldierInArray) {
      soldierInArray.position = { ...targetPosition };
      soldierInArray.isSelected = false;
    }
  }
  
  // 更新游戏状态
  newGameState.selectedPiece = null;
  newGameState.validMoves = [];
  
  // 检查胜负条件（在切换玩家之前）
  if (newGameState.soldierPieces.length < 6) {
    newGameState.gameOver = true;
    newGameState.winner = 'cannon';
  } else {
    // 检查是否所有大炮都被围困（无论轮到谁都要检查）
    const surrounded = areAllCannonsSurrounded(newGameState);
    if (surrounded) {
      newGameState.gameOver = true;
      newGameState.winner = 'soldier';
    }
  }
  
  // 只有在游戏未结束时才切换玩家
  if (!newGameState.gameOver) {
    newGameState.currentPlayer = newGameState.currentPlayer === 'cannon' ? 'soldier' : 'cannon';
  }
  
  return newGameState;
}

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: 8080 });

console.log('🚀 WebSocket服务器启动在端口 8080');

wss.on('connection', (ws) => {
  console.log('📱 新客户端连接');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 收到消息:', data.type, data);
      
      switch (data.type) {
        case 'join_room':
          handleJoinRoom(ws, data);
          break;
        case 'move':
          handleMove(ws, data);
          break;
        case 'restart_game':
          handleRestartGame(ws, data);
          break;
        default:
          console.log('❓ 未知消息类型:', data.type);
      }
    } catch (error) {
      console.error('❌ 解析消息失败:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: '无效的消息格式'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('📱 客户端断开连接');
    cleanupPlayer(ws);
  });
});

function handleJoinRoom(ws, data) {
  const { roomId, playerName } = data;
  
  console.log(`🏠 处理加入房间: ${roomId}, 玩家: ${playerName}`);
  
  // 获取或创建房间
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: [],
      gameState: initializeGame(),
      isStarted: false
    });
    console.log(`✨ 创建新房间: ${roomId}`);
  }
  
  const room = rooms.get(roomId);
  
  // 检查房间是否已满
  if (room.players.length >= 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间已满'
    }));
    return;
  }
  
  // 检查是否是重新连接
  let player = room.players.find(p => p.name === playerName);
  if (player) {
    console.log(`🔄 玩家重新连接: ${playerName}`);
    player.ws = ws;
    ws.playerId = player.id;
    ws.roomId = roomId;
  } else {
    // 创建新玩家
    const playerId = `player_${++playerCounter}`;
    const playerType = room.players.length === 0 ? 'cannon' : 'soldier';
    
    player = {
      id: playerId,
      name: playerName,
      type: playerType,
      ws: ws
    };
    
    room.players.push(player);
    ws.playerId = playerId;
    ws.roomId = roomId;
    
    console.log(`👤 新玩家加入: ${playerName} (${playerType})`);
  }
  
  // 发送加入房间成功消息
  ws.send(JSON.stringify({
    type: 'room_joined',
    roomId: roomId,
    playerId: player.id,
    playerType: player.type,
    isHost: room.players[0] === player,
    playersCount: room.players.length
  }));
  
  // 广播玩家加入消息
  broadcastToRoom(room, {
    type: 'player_joined',
    playerName: playerName,
    playersCount: room.players.length
  });
  
  // 如果房间满员，开始游戏
  if (room.players.length === 2 && !room.isStarted) {
    room.isStarted = true;
    console.log('🎮 游戏开始!');
    
    setTimeout(() => {
      broadcastToRoom(room, {
        type: 'game_start',
        gameState: room.gameState
      });
    }, 100);
  }
}

function handleMove(ws, data) {
  const { from, to, playerId } = data;
  
  const room = findRoomByPlayerId(playerId);
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间不存在'
    }));
    return;
  }
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '玩家不存在'
    }));
    return;
  }
  
  // 验证回合
  if (room.gameState.currentPlayer !== player.type) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '不是你的回合'
    }));
    return;
  }
  
  // 执行移动
  const piece = room.gameState.board[from.row][from.col];
  if (!piece || piece.type !== player.type) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '无效的移动'
    }));
    return;
  }
  
  try {
    room.gameState = movePiece(room.gameState, piece, to);
    
    console.log(`♟️ 玩家 ${player.name} 移动: (${from.row},${from.col}) -> (${to.row},${to.col})`);
    
    // 广播游戏状态更新
    broadcastToRoom(room, {
      type: 'game_update',
      gameState: room.gameState
    });
    
    // 检查游戏结束
    if (room.gameState.gameOver) {
      console.log(`🏆 游戏结束! 胜利者: ${room.gameState.winner}`);
      broadcastToRoom(room, {
        type: 'game_over',
        winner: room.gameState.winner,
        reason: room.gameState.winner === 'cannon' ? '小兵数量不足' : '大炮被围困'
      });
    }
  } catch (error) {
    console.error('❌ 移动失败:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '移动失败'
    }));
  }
}

function handleRestartGame(ws, data) {
  const { playerId } = data;
  
  const room = findRoomByPlayerId(playerId);
  if (!room) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '房间不存在'
    }));
    return;
  }
  
  const player = room.players.find(p => p.id === playerId);
  if (!player) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '玩家不存在'
    }));
    return;
  }
  
  // 只有房间满员才能重新开始
  if (room.players.length !== 2) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '需要两个玩家才能重新开始'
    }));
    return;
  }
  
  console.log(`🔄 玩家 ${player.name} 请求重新开始游戏`);
  
  // 重置游戏状态
  room.gameState = initializeGame();
  room.isStarted = true;
  
  // 广播游戏重新开始
  broadcastToRoom(room, {
    type: 'game_restart',
    gameState: room.gameState
  });
  
  console.log('🎮 游戏重新开始!');
}

function broadcastToRoom(room, message) {
  const messageStr = JSON.stringify({ ...message, timestamp: Date.now() });
  
  room.players.forEach((player, index) => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      console.log(`📤 发送给玩家${index + 1}: ${player.name} (${player.type})`);
      player.ws.send(messageStr);
    }
  });
}

function findRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) {
      return room;
    }
  }
  return null;
}

function cleanupPlayer(ws) {
  if (ws.roomId && ws.playerId) {
    const room = rooms.get(ws.roomId);
    if (room) {
      room.players = room.players.filter(p => p.ws !== ws);
      console.log(`🧹 清理玩家，房间 ${ws.roomId} 剩余玩家: ${room.players.length}`);
      
      if (room.players.length === 0) {
        rooms.delete(ws.roomId);
        console.log(`🗑️ 删除空房间: ${ws.roomId}`);
      } else {
        // 通知其他玩家
        broadcastToRoom(room, {
          type: 'player_left',
          playersCount: room.players.length
        });
      }
    }
  }
} 