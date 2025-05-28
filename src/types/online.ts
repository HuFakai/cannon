import { Position, GameState, PlayerType } from './game';

// 消息类型枚举
export enum MessageType {
  JOIN_ROOM = 'join_room',
  ROOM_JOINED = 'room_joined',
  PLAYER_JOINED = 'player_joined',
  GAME_START = 'game_start',
  MOVE = 'move',
  GAME_UPDATE = 'game_update',
  GAME_OVER = 'game_over',
  GAME_RESTART = 'game_restart',
  RESTART_GAME = 'restart_game',
  PLAYER_LEFT = 'player_left',
  ERROR = 'error'
}

// WebSocket消息基础接口
export interface BaseMessage {
  type: MessageType;
  timestamp: number;
}

// 加入房间消息
export interface JoinRoomMessage extends BaseMessage {
  type: MessageType.JOIN_ROOM;
  roomId: string;
  playerName: string;
}

// 房间已加入消息
export interface RoomJoinedMessage extends BaseMessage {
  type: MessageType.ROOM_JOINED;
  roomId: string;
  playerId: string;
  playerType: PlayerType;
}

// 玩家加入消息
export interface PlayerJoinedMessage extends BaseMessage {
  type: MessageType.PLAYER_JOINED;
  playerName: string;
  playersCount: number;
}

// 游戏开始消息
export interface GameStartMessage extends BaseMessage {
  type: MessageType.GAME_START;
  gameState: GameState;
}

// 移动消息
export interface MoveMessage extends BaseMessage {
  type: MessageType.MOVE;
  from: Position;
  to: Position;
  playerId: string;
}

// 游戏更新消息
export interface GameUpdateMessage extends BaseMessage {
  type: MessageType.GAME_UPDATE;
  gameState: GameState;
}

// 游戏结束消息
export interface GameOverMessage extends BaseMessage {
  type: MessageType.GAME_OVER;
  winner: PlayerType;
  reason: string;
}

// 游戏重新开始消息
export interface GameRestartMessage extends BaseMessage {
  type: MessageType.GAME_RESTART;
  gameState: GameState;
}

// 重新开始游戏请求消息
export interface RestartGameMessage extends BaseMessage {
  type: MessageType.RESTART_GAME;
  playerId: string;
}

// 玩家离开消息
export interface PlayerLeftMessage extends BaseMessage {
  type: MessageType.PLAYER_LEFT;
  playerName: string;
}

// 错误消息
export interface ErrorMessage extends BaseMessage {
  type: MessageType.ERROR;
  message: string;
}

// 所有消息类型的联合类型
export type WebSocketMessage = 
  | JoinRoomMessage
  | RoomJoinedMessage
  | PlayerJoinedMessage
  | GameStartMessage
  | MoveMessage
  | GameUpdateMessage
  | GameOverMessage
  | GameRestartMessage
  | RestartGameMessage
  | PlayerLeftMessage
  | ErrorMessage;

// 连接状态
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// 在线游戏状态
export interface OnlineGameState {
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
  roomId: string;
  playerId: string;
  playerType: PlayerType | null;
  isHost: boolean;
  playersCount: number;
  ws: WebSocket | null;
} 