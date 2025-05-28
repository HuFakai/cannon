import React from 'react';
import { Piece, Position, PieceType } from '../types/game';
import '../styles/Cell.css';

interface CellProps {
  position: Position;
  piece: Piece | null;
  isValidMove: boolean;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({ position, piece, isValidMove, onClick }) => {
  // 获取单元格类名
  const getCellClassName = (): string => {
    let className = 'cell';
    
    if (isValidMove) {
      className += ' valid-move';
    }
    
    return className;
  };
  
  // 获取棋子类名
  const getPieceClassName = (): string => {
    if (!piece) return '';
    
    let className = 'piece';
    
    if (piece.type === PieceType.CANNON) {
      className += ' cannon';
    } else {
      className += ' soldier';
    }
    
    if (piece.isSelected) {
      className += ' selected';
    }
    
    return className;
  };

  return (
    <div className={getCellClassName()} onClick={onClick}>
      {piece && (
        <div className={getPieceClassName()}>
          {piece.type === PieceType.CANNON ? '炮' : '兵'}
        </div>
      )}
    </div>
  );
};

export default Cell; 