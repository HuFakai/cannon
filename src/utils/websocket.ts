import { 
  WebSocketMessage, 
  MessageType, 
  ConnectionStatus, 
  JoinRoomMessage,
  MoveMessage 
} from '../types/online';
import { Position } from '../types/game';
// 注释掉模拟WebSocket服务器，使用真实服务器
// import './mockWebSocketServer';

// WebSocket服务器地址
const WS_URL = 'ws://localhost:8080';

class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<MessageType, Function[]> = new Map();
  private connectionStatusHandlers: Function[] = [];

  constructor() {
    // 初始化消息处理器
    Object.values(MessageType).forEach(type => {
      this.messageHandlers.set(type, []);
    });
  }

  // 连接到WebSocket服务器
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.notifyConnectionStatus(ConnectionStatus.CONNECTING);
        
        // 创建WebSocket连接
        this.ws = new WebSocket(WS_URL);
        
        this.ws.onopen = () => {
          console.log('WebSocket连接已建立');
          this.reconnectAttempts = 0;
          this.notifyConnectionStatus(ConnectionStatus.CONNECTED);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('解析WebSocket消息失败:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭', event.code, event.reason);
          this.notifyConnectionStatus(ConnectionStatus.DISCONNECTED);
          
          // 只有在非正常关闭时才尝试重连
          if (event.code !== 1000) { // 1000是正常关闭码
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket连接错误:', error);
          this.notifyConnectionStatus(ConnectionStatus.ERROR);
          reject(error);
        };

      } catch (error) {
        this.notifyConnectionStatus(ConnectionStatus.ERROR);
        reject(error);
      }
    });
  }

  // 断开连接
  disconnect() {
    // 停止重连尝试
    this.reconnectAttempts = this.maxReconnectAttempts;
    
    if (this.ws) {
      // 使用正常关闭码，避免重连
      this.ws.close(1000, '用户主动断开连接');
      this.ws = null;
    }
    this.notifyConnectionStatus(ConnectionStatus.DISCONNECTED);
  }

  // 发送消息
  sendMessage(message: Partial<WebSocketMessage>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage = {
        ...message,
        timestamp: Date.now()
      };
      this.ws.send(JSON.stringify(fullMessage));
    } else {
      console.error('WebSocket未连接，无法发送消息');
    }
  }

  // 加入房间
  joinRoom(roomId: string, playerName: string) {
    const message: Partial<JoinRoomMessage> = {
      type: MessageType.JOIN_ROOM,
      roomId,
      playerName
    };
    this.sendMessage(message);
  }

  // 发送移动
  sendMove(from: Position, to: Position, playerId: string) {
    const message: Partial<MoveMessage> = {
      type: MessageType.MOVE,
      from,
      to,
      playerId
    };
    this.sendMessage(message);
  }

  // 重新开始游戏
  restartGame(playerId: string) {
    const message = {
      type: MessageType.RESTART_GAME,
      playerId
    };
    this.sendMessage(message);
  }

  // 添加消息处理器
  on(messageType: MessageType, handler: Function) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      handlers.push(handler);
    }
  }

  // 移除消息处理器
  off(messageType: MessageType, handler: Function) {
    const handlers = this.messageHandlers.get(messageType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // 添加连接状态处理器
  onConnectionStatusChange(handler: Function) {
    this.connectionStatusHandlers.push(handler);
  }

  // 移除连接状态处理器
  offConnectionStatusChange(handler: Function) {
    const index = this.connectionStatusHandlers.indexOf(handler);
    if (index > -1) {
      this.connectionStatusHandlers.splice(index, 1);
    }
  }

  // 处理收到的消息
  private handleMessage(message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  // 通知连接状态变化
  private notifyConnectionStatus(status: ConnectionStatus) {
    this.connectionStatusHandlers.forEach(handler => handler(status));
  }

  // 尝试重连
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('重连失败:', error);
        });
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  // 获取连接状态
  getConnectionStatus(): ConnectionStatus {
    if (!this.ws) return ConnectionStatus.DISCONNECTED;
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return ConnectionStatus.CONNECTING;
      case WebSocket.OPEN:
        return ConnectionStatus.CONNECTED;
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
        return ConnectionStatus.DISCONNECTED;
      default:
        return ConnectionStatus.ERROR;
    }
  }
}

// 创建全局WebSocket管理器实例
export const wsManager = new WebSocketManager();

// 导出类以便创建多个实例进行测试
export { WebSocketManager }; 