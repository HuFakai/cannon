import React from 'react';
import Cell from './Cell';
import { GameState, Position } from '../types/game';
import '../styles/Board.css';

interface BoardProps {
  gameState: GameState;
  onCellClick: (position: Position) => void;
}

const Board: React.FC<BoardProps> = ({ gameState, onCellClick }) => {
  const { board, validMoves } = gameState;
  
  // 防护：确保board存在且是有效的二维数组
  if (!board || !Array.isArray(board) || board.length === 0) {
    console.error('Board数据无效:', board);
    return <div className="board">棋盘加载中...</div>;
  }
  
  // 检查位置是否是有效移动位置
  const isValidMove = (position: Position): boolean => {
    if (!validMoves || !Array.isArray(validMoves)) return false;
    return validMoves.some(move => move.row === position.row && move.col === position.col);
  };

  return (
    <div className="board">
      {board.map((row, rowIndex) => {
        // 防护：确保row存在且是数组
        if (!row || !Array.isArray(row)) {
          console.error(`第${rowIndex}行数据无效:`, row);
          return null;
        }
        
        return (
          <div key={`row-${rowIndex}`} className="board-row">
            {row.map((piece, colIndex) => {
              const position: Position = { row: rowIndex, col: colIndex };
              const isValid = isValidMove(position);
              
              return (
                <Cell
                  key={`cell-${rowIndex}-${colIndex}`}
                  position={position}
                  piece={piece || null}
                  isValidMove={isValid}
                  onClick={() => onCellClick(position)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default Board; 