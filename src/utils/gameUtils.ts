import { 
  Piece, 
  Position, 
  PieceType, 
  PlayerType, 
  GameState, 
  DIRECTIONS, 
  BOARD_SIZE 
} from '../types/game';

// 初始化游戏状态
export const initializeGame = (): GameState => {
  // 创建空棋盘
  const board: (Piece | null)[][] = Array(BOARD_SIZE).fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
  
  // 创建大炮棋子（第二行第三列和第二行第四列）
  const cannonPieces: Piece[] = [
    {
      id: 'cannon-1',
      type: PieceType.CANNON,
      position: { row: 1, col: 2 },
      isSelected: false
    },
    {
      id: 'cannon-2',
      type: PieceType.CANNON,
      position: { row: 1, col: 3 },
      isSelected: false
    }
  ];
  
  // 创建小兵棋子（第四行到第六行的所有格子）
  const soldierPieces: Piece[] = [];
  let soldierId = 1;
  
  for (let row = 3; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      soldierPieces.push({
        id: `soldier-${soldierId++}`,
        type: PieceType.SOLDIER,
        position: { row, col },
        isSelected: false
      });
    }
  }
  
  // 将棋子放置到棋盘上
  cannonPieces.forEach(piece => {
    board[piece.position.row][piece.position.col] = piece;
  });
  
  soldierPieces.forEach(piece => {
    board[piece.position.row][piece.position.col] = piece;
  });
  
  return {
    board,
    currentPlayer: PlayerType.CANNON, // 大炮玩家先手
    cannonPieces,
    soldierPieces,
    selectedPiece: null,
    validMoves: [],
    gameOver: false,
    winner: null
  };
};

// 检查位置是否在棋盘范围内
export const isPositionInBoard = (position: Position): boolean => {
  const { row, col } = position;
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

// 检查位置是否为空
export const isPositionEmpty = (board: (Piece | null)[][], position: Position): boolean => {
  return board[position.row][position.col] === null;
};

// 获取大炮可以移动的位置
export const getCannonValidMoves = (gameState: GameState, piece: Piece): Position[] => {
  const { board } = gameState;
  const validMoves: Position[] = [];
  
  // 大炮可以上下左右移动一格
  DIRECTIONS.forEach(direction => {
    const newPosition: Position = {
      row: piece.position.row + direction.row,
      col: piece.position.col + direction.col
    };
    
    if (isPositionInBoard(newPosition) && isPositionEmpty(board, newPosition)) {
      validMoves.push(newPosition);
    }
  });
  
  return validMoves;
};

// 获取大炮可以吃的小兵
export const getCannonCaptures = (gameState: GameState, position: Position): Position[] => {
  const { board } = gameState;
  const captures: Position[] = [];
  
  // 检查四个方向
  DIRECTIONS.forEach(direction => {
    // 相隔一格的位置
    const capturePosition: Position = {
      row: position.row + direction.row * 2,
      col: position.col + direction.col * 2
    };
    
    // 中间的位置
    const middlePosition: Position = {
      row: position.row + direction.row,
      col: position.col + direction.col
    };
    
    // 如果相隔一格的位置在棋盘内，中间位置为空，且相隔一格的位置是小兵
    if (
      isPositionInBoard(capturePosition) && 
      isPositionInBoard(middlePosition) &&
      isPositionEmpty(board, middlePosition) &&
      board[capturePosition.row][capturePosition.col]?.type === PieceType.SOLDIER
    ) {
      captures.push(capturePosition);
    }
  });
  
  return captures;
};

// 获取小兵可以移动的位置
export const getSoldierValidMoves = (gameState: GameState, piece: Piece): Position[] => {
  const { board } = gameState;
  const validMoves: Position[] = [];
  
  // 小兵可以上下左右移动一格
  DIRECTIONS.forEach(direction => {
    const newPosition: Position = {
      row: piece.position.row + direction.row,
      col: piece.position.col + direction.col
    };
    
    if (isPositionInBoard(newPosition) && isPositionEmpty(board, newPosition)) {
      validMoves.push(newPosition);
    }
  });
  
  return validMoves;
};

// 检查大炮是否被围困（只检查相邻位置是否能移动，不考虑吃子）
const canCannonMove = (gameState: GameState, cannonPiece: Piece): boolean => {
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
};

// 检查游戏是否结束
export const checkGameOver = (gameState: GameState): { gameOver: boolean; winner: PlayerType | null } => {
  const { cannonPieces, soldierPieces } = gameState;
  
  // 检查小兵数量
  if (soldierPieces.length < 6) {
    return { gameOver: true, winner: PlayerType.CANNON };
  }
  
  // 检查所有大炮是否都无法移动（不依赖于currentPlayer）
  const allCannonsSurrounded = cannonPieces.every(cannon => !canCannonMove(gameState, cannon));
  if (allCannonsSurrounded) {
    return { gameOver: true, winner: PlayerType.SOLDIER };
  }
  
  return { gameOver: false, winner: null };
};

// 移动棋子
export const movePiece = (
  gameState: GameState, 
  piece: Piece, 
  targetPosition: Position
): GameState => {
  const newGameState = { ...gameState };
  const { board, cannonPieces, soldierPieces } = newGameState;
  
  // 更新棋盘
  board[piece.position.row][piece.position.col] = null;
  
  // 如果是大炮吃小兵
  if (
    piece.type === PieceType.CANNON && 
    board[targetPosition.row][targetPosition.col]?.type === PieceType.SOLDIER
  ) {
    // 找到被吃的小兵
    const capturedSoldierIndex = soldierPieces.findIndex(
      s => s.position.row === targetPosition.row && s.position.col === targetPosition.col
    );
    
    if (capturedSoldierIndex !== -1) {
      // 移除被吃的小兵
      newGameState.soldierPieces = [
        ...soldierPieces.slice(0, capturedSoldierIndex),
        ...soldierPieces.slice(capturedSoldierIndex + 1)
      ];
    }
  }
  
  // 更新棋子位置
  const pieceToUpdate = piece.type === PieceType.CANNON 
    ? cannonPieces.find(p => p.id === piece.id)
    : soldierPieces.find(p => p.id === piece.id);
  
  if (pieceToUpdate) {
    pieceToUpdate.position = { ...targetPosition };
    pieceToUpdate.isSelected = false;
    board[targetPosition.row][targetPosition.col] = pieceToUpdate;
  }
  
  // 清除选中状态和有效移动
  newGameState.selectedPiece = null;
  newGameState.validMoves = [];
  
  // 检查游戏是否结束（在切换玩家之前）
  const { gameOver, winner } = checkGameOver(newGameState);
  newGameState.gameOver = gameOver;
  newGameState.winner = winner;
  
  // 只有在游戏未结束时才切换玩家
  if (!newGameState.gameOver) {
    newGameState.currentPlayer = 
      newGameState.currentPlayer === PlayerType.CANNON 
        ? PlayerType.SOLDIER 
        : PlayerType.CANNON;
  }
  
  return newGameState;
}; 