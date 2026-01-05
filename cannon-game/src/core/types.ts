/**
 * 游戏核心类型定义
 */

// 位置坐标
export interface Position {
    row: number;
    col: number;
}

// 棋子类型
export type PieceType = 'cannon' | 'soldier';

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
export type GameMode = 'local' | 'online' | 'ai_easy' | 'ai_medium' | 'ai_hard';

// AI难度等级
export type AIDifficulty = 1 | 2 | 3;

