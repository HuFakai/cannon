/**
 * 游戏规则系统
 * 负责验证移动合法性、吃子判定、胜负判定等
 */

import type { Position, PieceType, Cell, GameState } from './types';

export class RuleSystem {
    // 棋盘尺寸
    static readonly BOARD_SIZE = 6;

    /**
     * 检查位置是否在棋盘范围内
     */
    static isValidPosition(pos: Position): boolean {
        return pos.row >= 0 && pos.row < this.BOARD_SIZE &&
            pos.col >= 0 && pos.col < this.BOARD_SIZE;
    }

    /**
     * 检查两个位置是否相同
     */
    static isSamePosition(pos1: Position, pos2: Position): boolean {
        return pos1.row === pos2.row && pos1.col === pos2.col;
    }

    /**
     * 获取位置上的棋子类型
     */
    static getPieceAt(board: Cell[][], pos: Position): PieceType | null {
        if (!this.isValidPosition(pos)) return null;
        return board[pos.row][pos.col].piece;
    }

    /**
     * 检查移动是否合法（仅移动一格，上下左右）
     */
    static isValidMove(from: Position, to: Position): boolean {
        if (!this.isValidPosition(from) || !this.isValidPosition(to)) {
            return false;
        }

        const rowDiff = Math.abs(to.row - from.row);
        const colDiff = Math.abs(to.col - from.col);

        // 必须是上下左右移动一格
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    /**
     * 获取所有可到达的相邻位置
     */
    static getAdjacentPositions(pos: Position): Position[] {
        const directions = [
            { row: -1, col: 0 },  // 上
            { row: 1, col: 0 },   // 下
            { row: 0, col: -1 },  // 左
            { row: 0, col: 1 }    // 右
        ];

        return directions
            .map(dir => ({
                row: pos.row + dir.row,
                col: pos.col + dir.col
            }))
            .filter(p => this.isValidPosition(p));
    }

    /**
     * 获取棋子的所有合法移动位置
     */
    static getLegalMoves(board: Cell[][], pos: Position): Position[] {
        const piece = this.getPieceAt(board, pos);
        if (!piece) return [];

        const adjacent = this.getAdjacentPositions(pos);

        // 只能移动到空格子
        return adjacent.filter(p => this.getPieceAt(board, p) === null);
    }

    /**
     * 检查大炮是否可以吃掉指定位置的小兵
     * 规则：大炮与小兵在同一直线上，中间相隔一格且无其他棋子
     */
    static canCannonCapture(board: Cell[][], cannonPos: Position, soldierPos: Position): boolean {
        // 检查大炮位置
        if (this.getPieceAt(board, cannonPos) !== 'cannon') return false;

        // 检查目标位置是否是小兵
        if (this.getPieceAt(board, soldierPos) !== 'soldier') return false;

        // 检查是否在同一直线上
        const rowDiff = soldierPos.row - cannonPos.row;
        const colDiff = soldierPos.col - cannonPos.col;

        // 必须在同一行或同一列
        if (rowDiff !== 0 && colDiff !== 0) return false;

        // 计算中间位置
        let middlePos: Position;
        if (rowDiff !== 0) {
            // 同一列，检查行方向
            const direction = rowDiff > 0 ? 1 : -1;
            middlePos = { row: cannonPos.row + direction, col: cannonPos.col };
        } else {
            // 同一行，检查列方向
            const direction = colDiff > 0 ? 1 : -1;
            middlePos = { row: cannonPos.row, col: cannonPos.col + direction };
        }

        // 检查中间位置必须是空的
        if (this.getPieceAt(board, middlePos) !== null) return false;

        // 检查距离必须是2格
        const distance = Math.abs(rowDiff) + Math.abs(colDiff);
        return distance === 2;
    }

    /**
     * 获取大炮在当前位置可以吃掉的所有小兵
     */
    static getCapturableTargets(board: Cell[][], cannonPos: Position, soldierPositions: Position[]): Position[] {
        return soldierPositions.filter(soldierPos =>
            this.canCannonCapture(board, cannonPos, soldierPos)
        );
    }

    /**
     * 检查大炮是否能移动（是否被围困）
     */
    static canCannonMove(board: Cell[][], cannonPositions: Position[]): boolean {
        for (const pos of cannonPositions) {
            const legalMoves = this.getLegalMoves(board, pos);
            if (legalMoves.length > 0) return true;
        }
        return false;
    }

    /**
     * 检查游戏是否结束并返回胜者
     */
    static checkGameOver(state: GameState): { over: boolean; winner: 'cannon' | 'soldier' | null } {
        // 小兵少于6个，大炮方获胜
        if (state.soldierPositions.length < 6) {
            return { over: true, winner: 'cannon' };
        }

        // 大炮无法移动，小兵方获胜
        if (!this.canCannonMove(state.board, state.cannonPositions)) {
            return { over: true, winner: 'soldier' };
        }

        return { over: false, winner: null };
    }
}
