
export enum MessageType {
    CREATE_ROOM = 'CREATE_ROOM',
    JOIN_ROOM = 'JOIN_ROOM',
    LEAVE_ROOM = 'LEAVE_ROOM',
    GAME_START = 'GAME_START',
    MOVE = 'MOVE',
    GAME_OVER = 'GAME_OVER',
    ERROR = 'ERROR',
    PLAYER_DISCONNECTED = 'PLAYER_DISCONNECTED',
    REMATCH_REQUEST = 'REMATCH_REQUEST',
    REMATCH_NOTIFY = 'REMATCH_NOTIFY'
}

export interface Player {
    id: string;
    ws: any; // WebSocket connection
    name?: string;
    side?: 'cannon' | 'soldier';
    isReadyForRematch?: boolean;
}

export interface Room {
    id: string;
    players: Player[];
    gameState?: any;
    status: 'waiting' | 'playing' | 'finished';
}

export interface Message {
    type: MessageType;
    payload?: any;
}
