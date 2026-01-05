<template>
  <div class="local-game">
    <div class="game-header">
      <h1 class="game-title">火炮棋</h1>
      
      <!-- 统计信息移到上方 -->
      <div class="game-stats-bar">
        <div class="player-card" :class="{ active: currentPlayer === 'cannon' }">
          <div class="piece-icon piece-cannon">炮</div>
          <div class="player-info">
             <span class="label">大炮方</span>
             <span class="count">{{ gameState.cannonPositions.length }}</span>
          </div>
        </div>

        <div class="vs-info">
           <span class="round-label">Round</span>
           <span class="round-count">{{ Math.floor(moveCount / 2) + 1 }}</span>
        </div>

        <div class="player-card" :class="{ active: currentPlayer === 'soldier' }">
          <div class="piece-icon piece-soldier">兵</div>
          <div class="player-info">
             <span class="label">小兵方</span>
             <span class="count">{{ gameState.soldierPositions.length }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="game-content">
      <GameBoard 
        :board="gameState.board" 
        @cell-click="handleCellClick"
      />
    </div>

    <div class="game-controls">
      <button @click="resetGame" class="btn btn-primary">
        <span>重新开始</span>
      </button>
      <!-- 修复返回按钮逻辑 -->
      <button @click="router.push('/')" class="btn btn-secondary">
        <span>返回主菜单</span>
      </button>
    </div>

    <!-- 游戏结束弹窗 -->
    <div v-if="gameState.gameOver" class="game-over-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">游戏结束！</h2>
        <div class="winner-display">
          <div v-if="gameState.winner === 'cannon'" class="winner-piece piece-cannon">炮</div>
          <div v-else class="winner-piece piece-soldier">兵</div>
          <p class="winner-text">{{ winnerText }} 获胜！</p>
        </div>
        <div class="modal-actions">
          <button @click="resetGame" class="btn btn-primary">再来一局</button>
          <button @click="router.push('/')" class="btn btn-secondary">返回主菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import GameBoard from '../components/GameBoard.vue';
import { GameEngine } from '../core/GameEngine';
import type { GameState } from '../core/types';

const router = useRouter();
const engine = new GameEngine();
const gameState = ref<GameState>(engine.getState());
let unsubscribe: (() => void) | null = null;

const currentPlayer = computed(() => gameState.value.currentPlayer);
const moveCount = computed(() => gameState.value.moveHistory.length);
const winnerText = computed(() => {
  return gameState.value.winner === 'cannon' ? '大炮方' : '小兵方';
});

onMounted(() => {
  unsubscribe = engine.subscribe((state) => {
    gameState.value = state;
  });
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});

const handleCellClick = (row: number, col: number) => {
  const cell = gameState.value.board[row][col];
  
  // 如果点击的是当前玩家的棋子，进行选择
  if (cell.piece === gameState.value.currentPlayer) {
    engine.selectPiece({ row, col });
  }
  // 如果已经选中棋子，尝试移动（包括吃子）
  else if (gameState.value.selectedPiece) {
    const success = engine.movePiece({ row, col });
    if (!success) {
      // 移动失败（点击了空白处或无效位置），取消选择
      engine.deselectPiece();
    }
  }
};

const resetGame = () => {
  engine.reset();
};

const closeModal = () => {
  // 点击遮罩层不关闭，只能通过按钮操作
};
</script>

<style scoped>
.local-game {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.game-header {
  text-align: center;
  margin-bottom: 30px;
  width: 100%;
  max-width: 500px;
}

.game-title {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #a5a5db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 30px;
  letter-spacing: 2px;
}

/* 新的统计栏样式 */
.game-stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 15px 30px;
  border-radius: 24px;
  width: 100%;
}

@media (max-width: 600px) {
  .game-stats-bar {
    padding: 10px 15px;
    border-radius: 16px;
  }
  
  .player-card {
    gap: 8px;
    padding: 4px 8px;
  }
  
  .piece-icon {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }
  
  .player-info .label {
    font-size: 10px;
  }
  
  .player-info .count {
    font-size: 16px;
  }
  
  .round-label {
    display: none;
  }
  
  .round-count {
    font-size: 16px;
  }
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.player-card.active {
  opacity: 1;
  transform: scale(1.05);
}

.piece-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.piece-cannon {
  background: linear-gradient(135deg, #FF6B35 0%, #D64516 100%);
}

.piece-soldier {
  background: linear-gradient(135deg, #4ECDC4 0%, #2DA8A3 100%);
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.player-info .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.player-info .count {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.vs-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
}

.round-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.4);
}

.round-count {
  font-size: 24px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.8);
}

.game-content {
  margin-bottom: 30px;
  position: relative;
  z-index: 5;
}

.game-controls {
  display: flex;
  gap: 20px;
}

.btn {
  padding: 14px 30px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:active {
  transform: scale(0.95);
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
  color: white;
  box-shadow: 0 10px 20px rgba(255, 107, 53, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(255, 107, 53, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

/* 模态窗改良 */
.game-over-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.4s ease;
}

.modal-content {
  background: rgba(30, 30, 40, 0.9);
  padding: 60px;
  border-radius: 30px;
  text-align: center;
  box-shadow: 
    0 50px 100px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.winner-target {
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 64px;
  font-weight: 800;
  color: white;
  animation: bounceIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.winner-text {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #fff 0%, #a5a5db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(40px) scale(0.9); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
