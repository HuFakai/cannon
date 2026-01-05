
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { config } from 'dotenv';
import { roomManager } from './RoomManager';
import { MessageType, Player } from './types';

// 加载环境变量
config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = parseInt(process.env.PORT || '3000', 10);
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10);

console.log(`正在启动服务器... 端口: ${PORT}`);

// 心跳检测：定期检查连接状态
const heartbeat = setInterval(() => {
    wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) {
            console.log('连接超时，主动断开');
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
    clearInterval(heartbeat);
});

wss.on('connection', (ws: WebSocket) => {
    const playerId = randomUUID();
    const player: Player = { id: playerId, ws };

    // 初始化心跳状态
    (ws as any).isAlive = true;

    ws.on('pong', () => {
        (ws as any).isAlive = true;
    });

    console.log(`玩家连接: ${playerId}`);

    ws.on('message', (message: string) => {
        try {
            const data = JSON.parse(message.toString());
            handleMessage(player, data);
        } catch (error) {
            console.error('消息解析错误:', error);
            // 发送错误响应
            ws.send(JSON.stringify({
                type: MessageType.ERROR,
                payload: { message: '消息格式错误' }
            }));
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket错误 [${playerId}]:`, error.message);
    });

    ws.on('close', () => {
        console.log(`玩家断开: ${playerId}`);
        roomManager.removePlayer(playerId);
    });
});

function handleMessage(player: Player, message: any) {
    const { type, payload } = message;

    switch (type) {
        case MessageType.CREATE_ROOM:
            const preferredSide = payload?.side;
            const room = roomManager.createRoom(player, preferredSide);
            player.ws.send(JSON.stringify({
                type: MessageType.CREATE_ROOM,
                payload: { roomId: room.id, playerId: player.id }
            }));
            break;

        case MessageType.JOIN_ROOM:
            try {
                const roomId = payload.roomId;
                const joinedRoom = roomManager.joinRoom(roomId, player);

                if (joinedRoom) {
                    // 通知加入者
                    player.ws.send(JSON.stringify({
                        type: MessageType.JOIN_ROOM,
                        payload: {
                            roomId: joinedRoom.id,
                            playerId: player.id,
                            status: joinedRoom.status
                        }
                    }));

                    // 如果游戏开始（房间满员）
                    if (joinedRoom.status === 'playing') {
                        // 广播游戏开始，包含阵营信息
                        joinedRoom.players.forEach(p => {
                            p.ws.send(JSON.stringify({
                                type: MessageType.GAME_START,
                                payload: {
                                    roomId: joinedRoom.id,
                                    side: p.side, // 告诉玩家你是哪一方
                                    opponentId: joinedRoom.players.find(op => op.id !== p.id)?.id
                                }
                            }));
                        });
                    }
                }
            } catch (error: any) {
                player.ws.send(JSON.stringify({
                    type: MessageType.ERROR,
                    payload: { message: error.message }
                }));
            }
            break;

        case MessageType.MOVE:
            // 转发移动指令给对手
            // 假设客户端会发送 roomId
            const roomId = payload.roomId;
            const targetRoom = roomManager.getRoom(roomId);
            if (targetRoom) {
                // 广播给房间内其他人（即对手）
                roomManager.broadcastToRoom(targetRoom, {
                    type: MessageType.MOVE,
                    payload: payload.moveData // 前端传来的具体移动数据
                }, player.id);
            }
            break;

        case MessageType.GAME_OVER:
            const overRoomId = payload.roomId;
            const overRoom = roomManager.getRoom(overRoomId);
            if (overRoom) {
                roomManager.broadcastToRoom(overRoom, {
                    type: MessageType.GAME_OVER,
                    payload: payload
                }, player.id);
            }
            break;

        case MessageType.REMATCH_REQUEST:
            if (payload?.roomId) {
                roomManager.handleRematchRequest(payload.roomId, player.id);
            }
            break;
    }
}

server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`WebSocket 服务器已准备就绪`);
});
