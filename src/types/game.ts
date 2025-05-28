// 定义游戏中的玩家类型
export enum PlayerType {
  CANNON = 'cannon', // 大炮玩家
  SOLDIER = 'soldier' // 小兵玩家
}

// 定义棋子类型
export enum PieceType {
  CANNON = 'cannon', // 大炮
  SOLDIER = 'soldier' // 小兵
}

// 定义棋子位置
export interface Position {
  row: number;
  col: number;
}

// 定义棋子
export interface Piece {
  id: string;
  type: PieceType;
  position: Position;
  isSelected: boolean;
}

// 定义游戏状态
export interface GameState {
  board: (Piece | null)[][]; // 棋盘
  currentPlayer: PlayerType; // 当前玩家
  cannonPieces: Piece[]; // 大炮棋子
  soldierPieces: Piece[]; // 小兵棋子
  selectedPiece: Piece | null; // 当前选中的棋子
  validMoves: Position[]; // 有效移动位置
  gameOver: boolean; // 游戏是否结束
  winner: PlayerType | null; // 胜利者
}

// 定义移动方向
export const DIRECTIONS = [
  { row: -1, col: 0 }, // 上
  { row: 1, col: 0 },  // 下
  { row: 0, col: -1 }, // 左
  { row: 0, col: 1 }   // 右
];

// 棋盘尺寸
export const BOARD_SIZE = 6; 