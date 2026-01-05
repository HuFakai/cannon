/**
 * 游戏核心类型定义
 */

// 位置坐标
export interface Position {
    row: number;
    col: number;
}

// 棋子类型
export const enum PieceType {
    CANNON = 'cannon',   // 大炮
    SOLDIER = 'soldier'  // 小兵
}

// 玩家类型
export type PlayerType = 'cannon' | 'soldier';

// 棋盘格子状态
export interface Cell {
    piece: PieceType | null;
    isSelected: boolean;
    isHighlighted: boolean;
}

// 移动操作
export interface Move {
    from: Position;
    to: Position;
    capture?: Position;  // 吃子位置（仅大炮吃子时有值）
}

// 游戏状态
export interface GameState {
    board: Cell[][];
    currentPlayer: PlayerType;
    cannonPositions: Position[];
    soldierPositions: Position[];
    selectedPiece: Position | null;
    gameOver: boolean;
    winner: PlayerType | null;
    moveHistory: Move[];
}

// 游戏模式
export const enum GameMode {
    LOCAL = 'local',      // 本地双人对战
    ONLINE = 'online',    // 联机对战
    AI_EASY = 'ai_easy',  // 简单AI
    AI_MEDIUM = 'ai_medium',  // 中等AI
    AI_HARD = 'ai_hard'   // 困难AI
}

// AI难度等级
export const enum AIDifficulty {
    EASY = 1,
    MEDIUM = 2,
    HARD = 3
}
