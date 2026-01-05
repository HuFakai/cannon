/**
 * RuleSystem 单元测试
 * 测试游戏规则系统的核心逻辑
 */

import { describe, it, expect } from 'vitest';
import { RuleSystem } from './RuleSystem';
import type { Cell, GameState } from './types';

// 创建空棋盘的辅助函数
function createEmptyBoard(): Cell[][] {
    const board: Cell[][] = [];
    for (let row = 0; row < 6; row++) {
        board[row] = [];
        for (let col = 0; col < 6; col++) {
            board[row][col] = {
                piece: null,
                isSelected: false,
                isHighlighted: false
            };
        }
    }
    return board;
}

describe('RuleSystem', () => {
    describe('isValidPosition', () => {
        it('应该接受有效位置', () => {
            expect(RuleSystem.isValidPosition({ row: 0, col: 0 })).toBe(true);
            expect(RuleSystem.isValidPosition({ row: 5, col: 5 })).toBe(true);
            expect(RuleSystem.isValidPosition({ row: 3, col: 2 })).toBe(true);
        });

        it('应该拒绝越界位置', () => {
            expect(RuleSystem.isValidPosition({ row: -1, col: 0 })).toBe(false);
            expect(RuleSystem.isValidPosition({ row: 0, col: -1 })).toBe(false);
            expect(RuleSystem.isValidPosition({ row: 6, col: 0 })).toBe(false);
            expect(RuleSystem.isValidPosition({ row: 0, col: 6 })).toBe(false);
        });
    });

    describe('isSamePosition', () => {
        it('应该正确判断相同位置', () => {
            expect(RuleSystem.isSamePosition({ row: 1, col: 2 }, { row: 1, col: 2 })).toBe(true);
        });

        it('应该正确判断不同位置', () => {
            expect(RuleSystem.isSamePosition({ row: 1, col: 2 }, { row: 1, col: 3 })).toBe(false);
            expect(RuleSystem.isSamePosition({ row: 1, col: 2 }, { row: 2, col: 2 })).toBe(false);
        });
    });

    describe('isValidMove', () => {
        it('应该接受上下左右移动一格', () => {
            const from = { row: 2, col: 2 };

            expect(RuleSystem.isValidMove(from, { row: 1, col: 2 })).toBe(true); // 上
            expect(RuleSystem.isValidMove(from, { row: 3, col: 2 })).toBe(true); // 下
            expect(RuleSystem.isValidMove(from, { row: 2, col: 1 })).toBe(true); // 左
            expect(RuleSystem.isValidMove(from, { row: 2, col: 3 })).toBe(true); // 右
        });

        it('应该拒绝斜向移动', () => {
            const from = { row: 2, col: 2 };

            expect(RuleSystem.isValidMove(from, { row: 1, col: 1 })).toBe(false);
            expect(RuleSystem.isValidMove(from, { row: 1, col: 3 })).toBe(false);
            expect(RuleSystem.isValidMove(from, { row: 3, col: 1 })).toBe(false);
            expect(RuleSystem.isValidMove(from, { row: 3, col: 3 })).toBe(false);
        });

        it('应该拒绝移动超过一格', () => {
            const from = { row: 2, col: 2 };

            expect(RuleSystem.isValidMove(from, { row: 0, col: 2 })).toBe(false);
            expect(RuleSystem.isValidMove(from, { row: 2, col: 0 })).toBe(false);
        });

        it('应该拒绝原地不动', () => {
            expect(RuleSystem.isValidMove({ row: 2, col: 2 }, { row: 2, col: 2 })).toBe(false);
        });
    });

    describe('getAdjacentPositions', () => {
        it('应该返回中心位置的4个相邻位置', () => {
            const adjacent = RuleSystem.getAdjacentPositions({ row: 2, col: 2 });

            expect(adjacent.length).toBe(4);
            expect(adjacent).toContainEqual({ row: 1, col: 2 });
            expect(adjacent).toContainEqual({ row: 3, col: 2 });
            expect(adjacent).toContainEqual({ row: 2, col: 1 });
            expect(adjacent).toContainEqual({ row: 2, col: 3 });
        });

        it('应该过滤掉越界的相邻位置（角落）', () => {
            const adjacent = RuleSystem.getAdjacentPositions({ row: 0, col: 0 });

            expect(adjacent.length).toBe(2);
            expect(adjacent).toContainEqual({ row: 1, col: 0 });
            expect(adjacent).toContainEqual({ row: 0, col: 1 });
        });

        it('应该过滤掉越界的相邻位置（边缘）', () => {
            const adjacent = RuleSystem.getAdjacentPositions({ row: 0, col: 2 });

            expect(adjacent.length).toBe(3);
        });
    });

    describe('getLegalMoves', () => {
        it('应该返回空位置的合法移动', () => {
            const board = createEmptyBoard();
            board[2][2].piece = 'cannon';

            const moves = RuleSystem.getLegalMoves(board, { row: 2, col: 2 });

            expect(moves.length).toBe(4); // 四个方向都是空的
        });

        it('应该过滤掉有棋子的位置', () => {
            const board = createEmptyBoard();
            board[2][2].piece = 'cannon';
            board[1][2].piece = 'soldier'; // 上方有小兵

            const moves = RuleSystem.getLegalMoves(board, { row: 2, col: 2 });

            expect(moves.length).toBe(3);
            expect(moves).not.toContainEqual({ row: 1, col: 2 });
        });
    });

    describe('canCannonCapture', () => {
        it('大炮应该能隔一个空格吃子', () => {
            const board = createEmptyBoard();
            board[0][0].piece = 'cannon';
            board[2][0].piece = 'soldier'; // 隔一格

            expect(RuleSystem.canCannonCapture(board, { row: 0, col: 0 }, { row: 2, col: 0 })).toBe(true);
        });

        it('大炮不能吃相邻的小兵', () => {
            const board = createEmptyBoard();
            board[0][0].piece = 'cannon';
            board[1][0].piece = 'soldier'; // 相邻

            expect(RuleSystem.canCannonCapture(board, { row: 0, col: 0 }, { row: 1, col: 0 })).toBe(false);
        });

        it('大炮不能隔两格吃子', () => {
            const board = createEmptyBoard();
            board[0][0].piece = 'cannon';
            board[3][0].piece = 'soldier'; // 隔两格

            expect(RuleSystem.canCannonCapture(board, { row: 0, col: 0 }, { row: 3, col: 0 })).toBe(false);
        });

        it('中间有棋子时不能吃子', () => {
            const board = createEmptyBoard();
            board[0][0].piece = 'cannon';
            board[1][0].piece = 'soldier'; // 中间有棋子
            board[2][0].piece = 'soldier'; // 目标

            expect(RuleSystem.canCannonCapture(board, { row: 0, col: 0 }, { row: 2, col: 0 })).toBe(false);
        });

        it('大炮不能斜向吃子', () => {
            const board = createEmptyBoard();
            board[0][0].piece = 'cannon';
            board[2][2].piece = 'soldier'; // 斜向

            expect(RuleSystem.canCannonCapture(board, { row: 0, col: 0 }, { row: 2, col: 2 })).toBe(false);
        });
    });
});
