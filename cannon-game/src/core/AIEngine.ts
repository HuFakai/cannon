/**
 * AI引擎
 * 实现不同难度的AI对手
 */

import type { GameState, Position, Move } from './types';
import { RuleSystem } from './RuleSystem';

export class AIEngine {
    /**
     * 根据难度生成AI移动
     * @param state 当前游戏状态
     * @param difficulty 难度等级：1=简单, 2=中等, 3=困难
     * @param player 当前AI玩家：'cannon' | 'soldier'
     */
    static getBestMove(
        state: GameState,
        difficulty: 1 | 2 | 3,
        player: 'cannon' | 'soldier'
    ): Move | null {
        switch (difficulty) {
            case 1:
                return this.getEasyMove(state, player);
            case 2:
                return this.getMediumMove(state, player);
            case 3:
                return this.getHardMove(state, player);
            default:
                return this.getEasyMove(state, player);
        }
    }

    /**
     * 简单难度：随机选择合法移动，优先吃子
     */
    private static getEasyMove(state: GameState, player: 'cannon' | 'soldier'): Move | null {
        const positions = player === 'cannon' ? state.cannonPositions : state.soldierPositions;

        // 如果是大炮,优先查找吃子机会
        if (player === 'cannon') {
            for (const pos of positions) {
                const targets = RuleSystem.getCapturableTargets(state.board, pos, state.soldierPositions);
                if (targets.length > 0) {
                    // 随机选择一个可吃的小兵
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    if (target) {
                        return { from: pos, to: target, capture: target };
                    }
                }
            }
        }

        // 获取所有合法移动
        const allMoves: Move[] = [];
        for (const pos of positions) {
            const legalMoves = RuleSystem.getLegalMoves(state.board, pos);
            legalMoves.forEach(to => {
                allMoves.push({ from: pos, to });
            });
        }

        if (allMoves.length === 0) return null;

        // 随机选择一个移动
        return allMoves[Math.floor(Math.random() * allMoves.length)] || null;
    }

    /**
     * 中等难度：使用Min-Max算法，搜索深度3-4层
     */
    private static getMediumMove(state: GameState, player: 'cannon' | 'soldier'): Move | null {
        const depth = 3;
        return this.minimax(state, depth, true, player).move;
    }

    /**
     * 困难难度：使用Alpha-Beta剪枝，搜索深度5-6层
     */
    private static getHardMove(state: GameState, player: 'cannon' | 'soldier'): Move | null {
        const depth = 5;
        return this.alphabeta(state, depth, -Infinity, Infinity, true, player).move;
    }

    /**
     * Min-Max算法
     */
    private static minimax(
        state: GameState,
        depth: number,
        isMaximizing: boolean,
        aiPlayer: 'cannon' | 'soldier'
    ): { score: number; move: Move | null } {
        // 终止条件
        if (depth === 0 || state.gameOver) {
            return { score: this.evaluateState(state, aiPlayer), move: null };
        }

        const currentPlayer = state.currentPlayer;
        const positions = currentPlayer === 'cannon' ? state.cannonPositions : state.soldierPositions;

        let bestMove: Move | null = null;
        let bestScore = isMaximizing ? -Infinity : Infinity;

        // 遍历所有可能的移动
        for (const from of positions) {
            const moves = this.getAllPossibleMoves(state, from, currentPlayer);

            for (const move of moves) {
                const newState = this.applyMove(JSON.parse(JSON.stringify(state)), move);
                const result = this.minimax(newState, depth - 1, !isMaximizing, aiPlayer);

                if (isMaximizing) {
                    if (result.score > bestScore) {
                        bestScore = result.score;
                        bestMove = move;
                    }
                } else {
                    if (result.score < bestScore) {
                        bestScore = result.score;
                        bestMove = move;
                    }
                }
            }
        }

        return { score: bestScore, move: bestMove };
    }

    /**
     * Alpha-Beta剪枝算法
     */
    private static alphabeta(
        state: GameState,
        depth: number,
        alpha: number,
        beta: number,
        isMaximizing: boolean,
        aiPlayer: 'cannon' | 'soldier'
    ): { score: number; move: Move | null } {
        // 终止条件
        if (depth === 0 || state.gameOver) {
            return { score: this.evaluateState(state, aiPlayer), move: null };
        }

        const currentPlayer = state.currentPlayer;
        const positions = currentPlayer === 'cannon' ? state.cannonPositions : state.soldierPositions;

        let bestMove: Move | null = null;

        if (isMaximizing) {
            let maxScore = -Infinity;

            for (const from of positions) {
                const moves = this.getAllPossibleMoves(state, from, currentPlayer);

                for (const move of moves) {
                    const newState = this.applyMove(JSON.parse(JSON.stringify(state)), move);
                    const result = this.alphabeta(newState, depth - 1, alpha, beta, false, aiPlayer);

                    if (result.score > maxScore) {
                        maxScore = result.score;
                        bestMove = move;
                    }

                    alpha = Math.max(alpha, result.score);
                    if (beta <= alpha) {
                        break; // Beta剪枝
                    }
                }
            }

            return { score: maxScore, move: bestMove };
        } else {
            let minScore = Infinity;

            for (const from of positions) {
                const moves = this.getAllPossibleMoves(state, from, currentPlayer);

                for (const move of moves) {
                    const newState = this.applyMove(JSON.parse(JSON.stringify(state)), move);
                    const result = this.alphabeta(newState, depth - 1, alpha, beta, true, aiPlayer);

                    if (result.score < minScore) {
                        minScore = result.score;
                        bestMove = move;
                    }

                    beta = Math.min(beta, result.score);
                    if (beta <= alpha) {
                        break; // Alpha剪枝
                    }
                }
            }

            return { score: minScore, move: bestMove };
        }
    }

    /**
     * 获取某个棋子的所有可能移动（包括吃子）
     */
    private static getAllPossibleMoves(
        state: GameState,
        from: Position,
        player: 'cannon' | 'soldier'
    ): Move[] {
        const moves: Move[] = [];

        // 普通移动
        const legalMoves = RuleSystem.getLegalMoves(state.board, from);
        legalMoves.forEach(to => {
            moves.push({ from, to });
        });

        // 大炮吃子
        if (player === 'cannon') {
            const targets = RuleSystem.getCapturableTargets(state.board, from, state.soldierPositions);
            targets.forEach(target => {
                moves.push({ from, to: target, capture: target });
            });
        }

        return moves;
    }

    /**
     * 应用移动到状态（生成新状态）
     */
    private static applyMove(state: GameState, move: Move): GameState {
        const { from, to, capture } = move;
        const piece = state.board[from.row]?.[from.col]?.piece;

        if (!piece) return state;

        // 移除原位置棋子
        const fromRow = state.board[from.row];
        if (fromRow && fromRow[from.col]) {
            fromRow[from.col]!.piece = null;
        }

        // 如果是吃子
        if (capture) {
            const captureRow = state.board[capture.row];
            if (captureRow && captureRow[capture.col]) {
                captureRow[capture.col]!.piece = null;
            }
            state.soldierPositions = state.soldierPositions.filter(
                pos => !(pos.row === capture.row && pos.col === capture.col)
            );
        }

        // 放置到新位置
        const toRow = state.board[to.row];
        if (toRow && toRow[to.col]) {
            toRow[to.col]!.piece = piece;
        }

        // 更新位置记录
        if (piece === 'cannon') {
            const index = state.cannonPositions.findIndex(
                pos => pos.row === from.row && pos.col === from.col
            );
            if (index !== -1) {
                state.cannonPositions[index] = to;
            }
        } else {
            const index = state.soldierPositions.findIndex(
                pos => pos.row === from.row && pos.col === from.col
            );
            if (index !== -1) {
                state.soldierPositions[index] = to;
            }
        }

        // 切换玩家
        state.currentPlayer = state.currentPlayer === 'cannon' ? 'soldier' : 'cannon';

        // 检查游戏结束
        const result = RuleSystem.checkGameOver(state);
        state.gameOver = result.over;
        state.winner = result.winner;

        return state;
    }

    /**
     * 评估状态得分
     * 大炮方：正分越高越好
     * 小兵方：负分越小越好
     */
    private static evaluateState(state: GameState, aiPlayer: 'cannon' | 'soldier'): number {
        // 游戏结束立即评估
        if (state.gameOver) {
            if (state.winner === aiPlayer) {
                return 10000; // AI赢了
            } else {
                return -10000; // AI输了
            }
        }

        let score = 0;

        if (aiPlayer === 'cannon') {
            // 大炮方评估
            // 1. 小兵数量越少越好
            score += (18 - state.soldierPositions.length) * 100;

            // 2. 大炮的活动空间（自由度）
            for (const pos of state.cannonPositions) {
                const moves = RuleSystem.getLegalMoves(state.board, pos);
                score += moves.length * 5;

                // 可吃子的小兵数
                const targets = RuleSystem.getCapturableTargets(state.board, pos, state.soldierPositions);
                score += targets.length * 50;
            }

            // 3. 大炮位置：偏向棋盘中心更有利
            for (const pos of state.cannonPositions) {
                const centerDistance = Math.abs(pos.row - 2.5) + Math.abs(pos.col - 2.5);
                score += (7 - centerDistance) * 3;
            }
        } else {
            // 小兵方评估
            // 1. 小兵数量越多越好
            score -= (18 - state.soldierPositions.length) * 100;

            // 2. 大炮的自由度越小越好（包围效果）
            let cannonMobility = 0;
            for (const pos of state.cannonPositions) {
                const moves = RuleSystem.getLegalMoves(state.board, pos);
                cannonMobility += moves.length;
            }
            score -= cannonMobility * 15;

            // 3. 小兵靠近大炮（包围战术）
            for (const soldierPos of state.soldierPositions) {
                for (const cannonPos of state.cannonPositions) {
                    const distance = Math.abs(soldierPos.row - cannonPos.row) +
                        Math.abs(soldierPos.col - cannonPos.col);
                    score -= distance * 2;
                }
            }
        }

        return score;
    }
}
