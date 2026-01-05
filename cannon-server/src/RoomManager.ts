
import { Room, Player, MessageType } from './types';
import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(player: Player, preferredSide?: 'cannon' | 'soldier'): Room {
        const roomId = randomUUID().substring(0, 6).toUpperCase(); // 简短的房间号

        // 设置房主阵营
        if (preferredSide) {
            player.side = preferredSide;
        }

        const room: Room = {
            id: roomId,
            players: [player],
            status: 'waiting'
        };
        this.rooms.set(roomId, room);
        return room;
    }

    joinRoom(roomId: string, player: Player): Room | null {
        const room = this.rooms.get(roomId);

        if (!room) {
            throw new Error('房间不存在');
        }

        if (room.players.length >= 2) {
            throw new Error('房间已满');
        }

        if (room.status !== 'waiting') {
            throw new Error('游戏已开始');
        }

        room.players.push(player);

        if (room.players.length === 2) {
            room.status = 'playing';

            // 如果房主已经选了阵营
            if (room.players[0].side) {
                // 房主已选，二号玩家自动对立
                room.players[1].side = room.players[0].side === 'cannon' ? 'soldier' : 'cannon';
            } else {
                // 随机分配阵营
                const isFirstCannon = Math.random() > 0.5;
                room.players[0].side = isFirstCannon ? 'cannon' : 'soldier';
                room.players[1].side = isFirstCannon ? 'soldier' : 'cannon';
            }
        }

        return room;
    }

    getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    removePlayer(playerId: string): Room | null {
        for (const [roomId, room] of this.rooms.entries()) {
            const playerIndex = room.players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                // 移除玩家
                const removedPlayer = room.players[playerIndex];
                room.players.splice(playerIndex, 1);

                // 如果房间空了，删除房间
                if (room.players.length === 0) {
                    this.rooms.delete(roomId);
                    return null;
                } else {
                    // 如果游戏正在进行中，有人退出，游戏结束
                    if (room.status === 'playing') {
                        room.status = 'finished';
                        // 通知剩余玩家
                        this.broadcastToRoom(room, {
                            type: MessageType.PLAYER_DISCONNECTED,
                            payload: { message: '对方已离开游戏' }
                        });
                    }
                    return room;
                }
            }
        }
        return null; // 玩家不在任何房间
    }

    broadcastToRoom(room: Room, message: any, excludePlayerId?: string) {
        const jsonMessage = JSON.stringify(message);
        room.players.forEach(player => {
            if (player.id !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(jsonMessage);
            }
        });
    }
    handleRematchRequest(roomId: string, playerId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const player = room.players.find(p => p.id === playerId);
        const opponent = room.players.find(p => p.id !== playerId);

        if (player) {
            player.isReadyForRematch = true;

            // 通知对手，该玩家想重赛 (只发给对手，不发给发起者自己)
            if (opponent && opponent.ws.readyState === 1) { // 1 = WebSocket.OPEN
                opponent.ws.send(JSON.stringify({
                    type: MessageType.REMATCH_NOTIFY,
                    payload: { requesterId: playerId }
                }));
            }

            // 检查是否两人都准备好了
            const allReady = room.players.every(p => p.isReadyForRematch) && room.players.length === 2;

            if (allReady) {
                // 重置状态
                room.status = 'playing';
                room.players.forEach(p => p.isReadyForRematch = false);

                // 随机分配阵营 (重新开始或者交换阵营，这里选择随即/交换)
                // 简单起见，交换阵营
                const firstPlayerOldSide = room.players[0].side;
                room.players[0].side = firstPlayerOldSide === 'cannon' ? 'soldier' : 'cannon';
                room.players[1].side = room.players[0].side === 'cannon' ? 'soldier' : 'cannon';

                // 广播游戏开始
                room.players.forEach(p => {
                    p.ws.send(JSON.stringify({
                        type: MessageType.GAME_START,
                        payload: {
                            roomId: room.id,
                            side: p.side
                        }
                    }));
                });
            }
        }
    }
}

export const roomManager = new RoomManager();
