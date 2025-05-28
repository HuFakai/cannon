// 模拟WebSocket服务器，用于开发和测试
import { MessageType } from '../types/online';
import { PlayerType } from '../types/game';
import { initializeGame, movePiece } from './gameUtils';
import { debugLog, validateGameState, logGameStateChange } from './debugUtils';

interface Room {
  id: string;
  players: Player[];
  gameState: any;
  isStarted: boolean;
}

interface Player {
  id: string;
  name: string;
  type: PlayerType;
  ws: MockWebSocket;
}

// 深拷贝函数
function deepClone(obj: any): any {
  // 处理基本类型和null
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  
  // 处理Date对象
  if (obj instanceof Date) return new Date(obj.getTime());
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  // 处理普通对象
  if (typeof obj === 'object') {
    const clonedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  
  return obj;
}

// 模拟WebSocket类
export class MockWebSocket {
  private messageHandlers: ((event: { data: string }) => void)[] = [];
  private openHandlers: (() => void)[] = [];
  private closeHandlers: ((event: any) => void)[] = [];
  private errorHandlers: ((error: any) => void)[] = [];
  
  public readyState: number = WebSocket.CONNECTING;
  public url: string;

  constructor(url: string) {
    this.url = url;
    
    // 模拟连接延迟
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.openHandlers.forEach(handler => handler());
    }, 500);
  }

  // 事件处理器
  set onopen(handler: (() => void) | null) {
    if (handler) this.openHandlers.push(handler);
  }

  set onmessage(handler: ((event: { data: string }) => void) | null) {
    if (handler) this.messageHandlers.push(handler);
  }

  set onclose(handler: ((event: any) => void) | null) {
    if (handler) this.closeHandlers.push(handler);
  }

  set onerror(handler: ((error: any) => void) | null) {
    if (handler) this.errorHandlers.push(handler);
  }

  // 发送消息
  send(data: string) {
    if (this.readyState === WebSocket.OPEN) {
      // 确保使用全局单例服务器实例
      const server = (global as any).__mockWsServer || MockWebSocketServer.getInstance();
      server.handleMessage(this, data);
    }
  }

  // 关闭连接
  close(code?: number, reason?: string) {
    this.readyState = WebSocket.CLOSED;
    // 模拟CloseEvent
    const closeEvent = {
      code: code || 1000,
      reason: reason || '',
      wasClean: code === 1000
    };
    this.closeHandlers.forEach(handler => handler(closeEvent));
  }

  // 接收消息（由服务器调用）
  receive(data: string) {
    this.messageHandlers.forEach(handler => handler({ data }));
  }
}

// 模拟WebSocket服务器
class MockWebSocketServer {
  private static instance: MockWebSocketServer;
  private rooms: Map<string, Room> = new Map();
  private playerCounter = 0;

  static getInstance(): MockWebSocketServer {
    // 优先使用全局实例
    if ((global as any).__mockWsServer) {
      return (global as any).__mockWsServer;
    }
    
    if (!MockWebSocketServer.instance) {
      MockWebSocketServer.instance = new MockWebSocketServer();
      console.log('创建新的MockWebSocket服务器实例');
      // 保存到全局
      (global as any).__mockWsServer = MockWebSocketServer.instance;
    }
    return MockWebSocketServer.instance;
  }

  handleMessage(ws: MockWebSocket, data: string) {
    try {
      const message = JSON.parse(data);
      console.log('服务器收到消息:', message);
      
      switch (message.type) {
        case MessageType.JOIN_ROOM:
          this.handleJoinRoom(ws, message);
          break;
          
        case MessageType.MOVE:
          this.handleMove(ws, message);
          break;
          
        default:
          console.log('未处理的消息类型:', message.type);
      }
    } catch (error) {
      console.error('处理WebSocket消息失败:', error);
      this.sendError(ws, '无效的消息格式');
    }
  }

  // 清理空房间和无效连接
  private cleanupEmptyRooms() {
    const roomsToDelete: string[] = [];
    
    const roomEntries = Array.from(this.rooms.entries());
    for (const [roomId, room] of roomEntries) {
      // 移除无效的玩家连接
      room.players = room.players.filter((player: Player) => {
        const isValid = player.ws && player.ws.readyState === WebSocket.OPEN;
        if (!isValid) {
          console.log(`移除无效连接: ${player.name}`);
        }
        return isValid;
      });
      
      // 如果房间没有活跃玩家，标记删除
      if (room.players.length === 0) {
        roomsToDelete.push(roomId);
      }
    }
    
    roomsToDelete.forEach((roomId: string) => {
      console.log('清理空房间:', roomId);
      this.rooms.delete(roomId);
    });
  }

  private handleJoinRoom(ws: MockWebSocket, message: any) {
    const { roomId, playerName } = message;
    
    console.log(`处理加入房间请求: 房间ID=${roomId}, 玩家名=${playerName}`);
    console.log(`当前服务器房间列表:`, Array.from(this.rooms.keys()));
    
    // 清理无效房间
    this.cleanupEmptyRooms();
    
    // 获取或创建房间
    let room = this.rooms.get(roomId);
    console.log(`查找房间结果: ${room ? '找到现有房间' : '房间不存在'}`);
    if (!room) {
      room = {
        id: roomId,
        players: [],
        gameState: initializeGame(),
        isStarted: false
      };
      this.rooms.set(roomId, room);
      console.log('创建新房间:', roomId);
    } else {
      console.log('加入现有房间:', roomId, '当前玩家数:', room.players.length);
      console.log('现有玩家列表:', room.players.map(p => `${p.name}(${p.type})`));
    }

    // 检查房间是否已满
    if (room.players.length >= 2) {
      this.sendError(ws, '房间已满');
      return;
    }

    // 检查是否已有相同的玩家名称或需要重连的玩家
    const existingPlayerByName = room.players.find(player => player.name === playerName);
    if (existingPlayerByName) {
      console.log('玩家名称已存在，更新连接');
      // 更新WebSocket连接
      existingPlayerByName.ws = ws;
      
      // 发送当前状态
      this.sendMessage(ws, {
        type: MessageType.ROOM_JOINED,
        roomId,
        playerId: existingPlayerByName.id,
        playerType: existingPlayerByName.type,
        isHost: room.players[0] === existingPlayerByName,
        playersCount: room.players.length,
        timestamp: Date.now()
      });
      
      // 通知所有玩家有玩家重新连接
      this.broadcastToRoom(room, {
        type: MessageType.PLAYER_JOINED,
        playerName,
        playersCount: room.players.length,
        timestamp: Date.now()
      });
      
      // 如果游戏已开始，发送当前游戏状态
      if (room.isStarted) {
        const currentRoom = room; // 保存引用
        setTimeout(() => {
          this.sendMessage(ws, {
            type: MessageType.GAME_START,
            gameState: deepClone(currentRoom.gameState),
            timestamp: Date.now()
          });
        }, 50);
      }
      return;
    }

    // 创建玩家
    const playerId = `player_${++this.playerCounter}`;
    const currentPlayerCount = room.players.length;
    const playerType = currentPlayerCount === 0 ? PlayerType.CANNON : PlayerType.SOLDIER;
    const isHost = currentPlayerCount === 0;
    
    console.log(`分配玩家类型: 当前房间玩家数=${currentPlayerCount}, 新玩家类型=${playerType}`);
    
    const player: Player = {
      id: playerId,
      name: playerName,
      type: playerType,
      ws
    };

    room.players.push(player);
    console.log(`玩家 ${playerName} (${playerType}) 加入房间 ${roomId}，当前玩家数: ${room.players.length}`);

    // 先发送房间加入成功消息给新玩家
    this.sendMessage(ws, {
      type: MessageType.ROOM_JOINED,
      roomId,
      playerId,
      playerType,
      isHost,
      playersCount: room.players.length,
      timestamp: Date.now()
    });

    // 然后通知所有玩家（包括新玩家）有新玩家加入
    this.broadcastToRoom(room, {
      type: MessageType.PLAYER_JOINED,
      playerName,
      playersCount: room.players.length,
      timestamp: Date.now()
    });

    // 如果房间满员，开始游戏
    if (room.players.length === 2) {
      room.isStarted = true;
      console.log('游戏开始，初始状态:', room.gameState);
      
      // 稍微延迟后发送游戏开始消息，确保前面的消息已处理
      const currentRoom = room; // 保存房间引用
      setTimeout(() => {
        if (currentRoom && currentRoom.players.length === 2) {
          this.broadcastToRoom(currentRoom, {
            type: MessageType.GAME_START,
            gameState: deepClone(currentRoom.gameState),
            timestamp: Date.now()
          });
        }
      }, 100);
    }
  }

  private handleMove(ws: MockWebSocket, message: any) {
    const { from, to, playerId } = message;
    console.log(`处理移动: 玩家 ${playerId} 从 (${from.row},${from.col}) 到 (${to.row},${to.col})`);
    
    // 找到玩家所在的房间
    const room = this.findRoomByPlayer(playerId);
    if (!room) {
      this.sendError(ws, '房间不存在');
      return;
    }

    // 找到发送移动的玩家
    const player = room.players.find((p: Player) => p.id === playerId);
    if (!player) {
      this.sendError(ws, '玩家不存在');
      return;
    }

    // 验证是否轮到该玩家
    if (room.gameState.currentPlayer !== player.type) {
      console.log(`不是玩家 ${playerId} 的回合，当前回合:`, room.gameState.currentPlayer);
      this.sendError(ws, '不是你的回合');
      return;
    }

    // 找到要移动的棋子
    const piece = room.gameState.board[from.row][from.col];
    if (!piece) {
      this.sendError(ws, '没有找到棋子');
      return;
    }

    // 验证棋子所有权
    if (piece.type !== player.type) {
      this.sendError(ws, '不能移动对方的棋子');
      return;
    }

    try {
      // 验证移动前的游戏状态
      if (!validateGameState(room.gameState)) {
        this.sendError(ws, '游戏状态无效');
        return;
      }

      debugLog('MOVE', '移动前游戏状态:', {
        currentPlayer: room.gameState.currentPlayer,
        cannonCount: room.gameState.cannonPieces.length,
        soldierCount: room.gameState.soldierPieces.length
      });

      // 创建游戏状态的深拷贝
      const gameStateCopy = deepClone(room.gameState);
      const oldState = deepClone(room.gameState);
      
      // 执行移动并更新游戏状态
      room.gameState = movePiece(gameStateCopy, piece, to);
      
      // 验证移动后的游戏状态
      if (!validateGameState(room.gameState)) {
        debugLog('ERROR', '移动后游戏状态无效');
        this.sendError(ws, '移动导致游戏状态无效');
        return;
      }

      // 记录状态变化
      logGameStateChange(oldState, room.gameState, `移动 ${piece.id} 从 (${from.row},${from.col}) 到 (${to.row},${to.col})`);
      
      // 创建要广播的游戏状态副本
      const broadcastState = deepClone(room.gameState);
      
      debugLog('BROADCAST', '准备广播游戏状态', {
        currentPlayer: broadcastState.currentPlayer,
        cannonCount: broadcastState.cannonPieces.length,
        soldierCount: broadcastState.soldierPieces.length,
        gameOver: broadcastState.gameOver
      });
      
      // 广播游戏状态更新
      this.broadcastToRoom(room, {
        type: MessageType.GAME_UPDATE,
        gameState: broadcastState,
        timestamp: Date.now()
      });

      // 检查游戏是否结束
      if (room.gameState.gameOver) {
        console.log('游戏结束，胜利者:', room.gameState.winner);
        this.broadcastToRoom(room, {
          type: MessageType.GAME_OVER,
          winner: room.gameState.winner,
          reason: room.gameState.winner === PlayerType.CANNON ? '小兵数量不足' : '大炮被围困',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('执行移动失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.sendError(ws, '移动失败: ' + errorMessage);
    }
  }

  private findRoomByPlayer(playerId: string): Room | undefined {
    const roomsArray = Array.from(this.rooms.values());
    for (const room of roomsArray) {
      if (room.players.some((player: Player) => player.id === playerId)) {
        return room;
      }
    }
    return undefined;
  }

  private sendMessage(ws: MockWebSocket, message: any) {
    const messageStr = JSON.stringify(message);
    console.log('发送消息给客户端:', message.type);
    // 使用setTimeout模拟网络延迟
    setTimeout(() => {
      ws.receive(messageStr);
    }, 10);
  }

  private sendError(ws: MockWebSocket, errorMessage: string) {
    console.error('发送错误消息:', errorMessage);
    this.sendMessage(ws, {
      type: MessageType.ERROR,
      message: errorMessage,
      timestamp: Date.now()
    });
  }

  private broadcastToRoom(room: Room, message: any) {
    console.log(`广播消息到房间 ${room.id}:`, message.type, `给${room.players.length}个玩家`);
    
    // 过滤出有效连接的玩家
    const validPlayers = room.players.filter((player: Player) => 
      player.ws && player.ws.readyState === WebSocket.OPEN
    );
    
    console.log(`实际发送给${validPlayers.length}个在线玩家`);
    
    validPlayers.forEach((player: Player, index: number) => {
      console.log(`发送给玩家${index + 1}: ${player.name} (${player.type})`);
      this.sendMessage(player.ws, message);
    });
    
    // 如果有无效连接，清理它们
    if (validPlayers.length < room.players.length) {
      room.players = validPlayers;
      console.log(`清理房间 ${room.id}，剩余玩家: ${room.players.length}`);
    }
  }
}

// 如果在开发环境，替换全局WebSocket
if (process.env.NODE_ENV === 'development') {
  (global as any).WebSocket = MockWebSocket;
  
  // 确保服务器实例在全局范围内是唯一的
  if (!(global as any).__mockWsServer) {
    (global as any).__mockWsServer = MockWebSocketServer.getInstance();
    console.log('全局MockWebSocket服务器已初始化');
  }
} 