/**
 * 游戏引擎
 * 负责管理游戏状态、处理玩家操作、控制游戏流程
 */

import type { GameState, Position, Move, Cell } from './types';
import { RuleSystem } from './RuleSystem';

export class GameEngine {
    private state: GameState;
    private listeners: ((state: GameState) => void)[] = [];

    constructor() {
        this.state = this.createInitialState();
    }

    /**
     * 创建初始游戏状态
     */
    private createInitialState(): GameState {
        const board: Cell[][] = [];

        // 初始化6x6棋盘
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

        // 放置大炮：第二行第三列和第四列（索引从0开始，所以是row=1, col=2和col=3）
        const cannonPositions: Position[] = [
            { row: 1, col: 2 },
            { row: 1, col: 3 }
        ];
        cannonPositions.forEach(pos => {
            board[pos.row][pos.col].piece = 'cannon';
        });

        // 放置小兵：第四行到第六行的所有格子（row=3,4,5）
        const soldierPositions: Position[] = [];
        for (let row = 3; row < 6; row++) {
            for (let col = 0; col < 6; col++) {
                soldierPositions.push({ row, col });
                board[row][col].piece = 'soldier';
            }
        }

        return {
            board,
            currentPlayer: 'cannon',  // 大炮方先手
            cannonPositions,
            soldierPositions,
            selectedPiece: null,
            gameOver: false,
            winner: null,
            moveHistory: []
        };
    }

    /**
     * 重置游戏
     */
    reset(): void {
        this.state = this.createInitialState();
        this.notifyListeners();
    }

    /**
     * 获取当前游戏状态
     */
    getState(): GameState {
        return JSON.parse(JSON.stringify(this.state));  // 深拷贝
    }

    /**
     * 订阅状态变化
     */
    subscribe(listener: (state: GameState) => void): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有监听器
     */
    private notifyListeners(): void {
        const stateCopy = this.getState();
        this.listeners.forEach(listener => listener(stateCopy));
    }

    /**
     * 选择棋子
     */
    selectPiece(pos: Position): boolean {
        // 游戏已结束
        if (this.state.gameOver) return false;

        const piece = RuleSystem.getPieceAt(this.state.board, pos);

        // 没有棋子或不是当前玩家的棋子
        if (!piece || piece !== this.state.currentPlayer) {
            return false;
        }

        // 取消之前的选择
        if (this.state.selectedPiece) {
            const prev = this.state.selectedPiece;
            this.state.board[prev.row][prev.col].isSelected = false;
        }

        // 清除高亮
        this.clearHighlights();

        // 选中新棋子
        this.state.selectedPiece = pos;
        this.state.board[pos.row][pos.col].isSelected = true;

        // 高亮可移动位置 - 已禁用以增加难度
        // const legalMoves = RuleSystem.getLegalMoves(this.state.board, pos);
        // legalMoves.forEach(move => {
        //     this.state.board[move.row][move.col].isHighlighted = true;
        // });

        // 如果是大炮，高亮可吃子位置 - 已禁用以增加难度
        // if (piece === 'cannon') {
        //     const targets = RuleSystem.getCapturableTargets(
        //         this.state.board,
        //         pos,
        //         this.state.soldierPositions
        //     );
        //     targets.forEach(target => {
        //         this.state.board[target.row][target.col].isHighlighted = true;
        //     });
        // }

        this.notifyListeners();
        return true;
    }

    /**
     * 清除所有高亮
     */
    private clearHighlights(): void {
        this.state.board.forEach(row => {
            row.forEach(cell => {
                cell.isHighlighted = false;
            });
        });
    }

    /**
     * 移动棋子
     */
    movePiece(to: Position): boolean {
        if (!this.state.selectedPiece || this.state.gameOver) {
            return false;
        }

        const from = this.state.selectedPiece;
        const piece = RuleSystem.getPieceAt(this.state.board, from);

        if (!piece) return false;

        // 检查是否是普通移动
        const isLegalMove = RuleSystem.isValidMove(from, to) &&
            RuleSystem.getPieceAt(this.state.board, to) === null;

        // 检查是否是吃子操作
        const isCapture = piece === 'cannon' &&
            RuleSystem.canCannonCapture(this.state.board, from, to);

        if (!isLegalMove && !isCapture) {
            return false;
        }

        // 执行移动
        const move: Move = { from, to };

        // 移除原位置的棋子
        this.state.board[from.row][from.col].piece = null;
        this.state.board[from.row][from.col].isSelected = false;

        // 如果是吃子操作
        if (isCapture) {
            move.capture = to;
            // 移除被吃的小兵
            this.state.board[to.row][to.col].piece = null;
            this.state.soldierPositions = this.state.soldierPositions.filter(
                pos => !RuleSystem.isSamePosition(pos, to)
            );
        }

        // 放置棋子到新位置
        this.state.board[to.row][to.col].piece = piece;

        // 更新位置记录
        if (piece === 'cannon') {
            const index = this.state.cannonPositions.findIndex(
                pos => RuleSystem.isSamePosition(pos, from)
            );
            if (index !== -1) {
                this.state.cannonPositions[index] = to;
            }
        } else {
            const index = this.state.soldierPositions.findIndex(
                pos => RuleSystem.isSamePosition(pos, from)
            );
            if (index !== -1) {
                this.state.soldierPositions[index] = to;
            }
        }

        // 记录移动历史
        this.state.moveHistory.push(move);

        // 清除选择和高亮
        this.state.selectedPiece = null;
        this.clearHighlights();

        // 检查游戏是否结束
        const gameResult = RuleSystem.checkGameOver(this.state);
        if (gameResult.over) {
            this.state.gameOver = true;
            this.state.winner = gameResult.winner;
        } else {
            // 切换玩家
            this.state.currentPlayer = this.state.currentPlayer === 'cannon' ? 'soldier' : 'cannon';
        }

        this.notifyListeners();
        return true;
    }

    /**
     * 取消选择
     */
    deselectPiece(): void {
        if (this.state.selectedPiece) {
            const pos = this.state.selectedPiece;
            this.state.board[pos.row][pos.col].isSelected = false;
            this.state.selectedPiece = null;
            this.clearHighlights();
            this.notifyListeners();
        }
    }
}
