<!--
  AI对战模式
-->
<template>
  <div class="ai-game">
    <!-- 难度选择界面 -->
    <div v-if="!gameStarted" class="difficulty-selector">
      <h1 class="game-title">选择AI难度</h1>
      
      <div class="player-selection">
        <h2 class="selection-title">选择你的阵营</h2>
        <div class="player-options">
          <div 
            class="player-option" 
            :class="{ active: selectedSide === 'cannon' }"
            @click="selectedSide = 'cannon'"
          >
            <div class="piece-preview piece-cannon">炮</div>
            <span class="player-name">大炮方</span>
            <p class="player-desc">2枚大炮，需要击败12+小兵</p>
          </div>
          <div 
            class="player-option" 
            :class="{ active: selectedSide === 'soldier' }"
            @click="selectedSide = 'soldier'"
          >
            <div class="piece-preview piece-soldier">兵</div>
            <span class="player-name">小兵方</span>
            <p class="player-desc">18枚小兵，需要围困大炮</p>
          </div>
        </div>
      </div>

      <div class="difficulty-options">
        <div 
          class="difficulty-card" 
          :class="{ selected: selectedDifficulty === 1 }"
          @click="selectDifficulty(1)"
        >
          <div class="difficulty-icon">😊</div>
          <h3>简单</h3>
          <p>AI随机移动，适合新手</p>
        </div>
        
        <div 
          class="difficulty-card" 
          :class="{ selected: selectedDifficulty === 2 }"
          @click="selectDifficulty(2)"
        >
          <div class="difficulty-icon">🤔</div>
          <h3>中等</h3>
          <p>AI使用基础策略</p>
        </div>
        
        <div 
          class="difficulty-card" 
          :class="{ selected: selectedDifficulty === 3 }"
          @click="selectDifficulty(3)"
        >
          <div class="difficulty-icon">🧠</div>
          <h3>困难</h3>
          <p>AI使用高级算法</p>
        </div>
      </div>

      <div class="selection-actions">
        <button @click="startGame" class="btn btn-start" :disabled="!selectedDifficulty || !selectedSide">
          开始游戏
        </button>
        <button @click="goHome" class="btn btn-back-home">
          返回主菜单
        </button>
      </div>
    </div>

    <!-- 游戏界面 -->
    <div v-else class="game-container">
      <div class="game-header">
        <h1 class="game-title">火炮棋 - AI对战</h1>
        
        <!-- 顶部统计栏 -->
        <div class="game-stats-bar">
          <div class="player-card" :class="{ active: currentPlayer === 'cannon' }">
            <div class="piece-icon piece-cannon">炮</div>
            <div class="player-info">
               <span class="label">大炮方 {{ selectedSide === 'cannon' ? '(你)' : '(AI)' }}</span>
               <span class="count">{{ gameState.cannonPositions.length }}</span>
            </div>
            <!-- AI思考状态显示在卡片内 -->
            <div v-if="aiThinking && selectedSide !== 'cannon'" class="mini-thinking">
               <div class="thinking-dots"></div>
            </div>
          </div>

          <div class="vs-info">
             <span class="difficulty-badge" :class="difficultyClass">{{ difficultyText }}</span>
             <div class="round-info">
               <span class="round-label">Round</span>
               <span class="round-count">{{ Math.floor(moveCount / 2) + 1 }}</span>
             </div>
          </div>

          <div class="player-card" :class="{ active: currentPlayer === 'soldier' }">
            <div class="piece-icon piece-soldier">兵</div>
            <div class="player-info">
               <span class="label">小兵方 {{ selectedSide === 'soldier' ? '(你)' : '(AI)' }}</span>
               <span class="count">{{ gameState.soldierPositions.length }}</span>
            </div>
            <!-- AI思考状态显示在卡片内 -->
            <div v-if="aiThinking && selectedSide !== 'soldier'" class="mini-thinking">
               <div class="thinking-dots"></div>
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
        <button @click="backToMenu" class="btn btn-secondary">
          <span>返回菜单</span>
        </button>
      </div>
    </div>



    <!-- 游戏结束弹窗 -->
    <div v-if="gameState.gameOver" class="game-over-modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">游戏结束！</h2>
        <div class="winner-display">
          <div v-if="gameState.winner === 'cannon'" class="winner-piece piece-cannon">炮</div>
          <div v-else class="winner-piece piece-soldier">兵</div>
          <p class="winner-text">
            {{ isPlayerWin ? '恭喜你获胜！' : 'AI获胜！' }}
          </p>
        </div>
        <div class="modal-actions">
          <button @click="resetGame" class="btn btn-primary">再来一局</button>
          <button @click="backToMenu" class="btn btn-secondary">返回菜单</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router'; // Add this
import GameBoard from '../components/GameBoard.vue';
import { GameEngine } from '../core/GameEngine';
import { AIEngine } from '../core/AIEngine';
import type { GameState } from '../core/types';

const router = useRouter(); // Add this
const engine = new GameEngine();
const gameState = ref<GameState>(engine.getState());
let unsubscribe: (() => void) | null = null;

const gameStarted = ref(false);
const selectedDifficulty = ref<1 | 2 | 3 | null>(null);
const selectedSide = ref<'cannon' | 'soldier' | null>(null);
const aiThinking = ref(false);

const currentPlayer = computed(() => gameState.value.currentPlayer);
const moveCount = computed(() => gameState.value.moveHistory.length);
const isPlayerTurn = computed(() => currentPlayer.value === selectedSide.value);
const isPlayerWin = computed(() => gameState.value.winner === selectedSide.value);

const difficultyText = computed(() => {
  switch (selectedDifficulty.value) {
    case 1: return '简单';
    case 2: return '中等';
    case 3: return '困难';
    default: return '';
  }
});

const difficultyClass = computed(() => {
  switch (selectedDifficulty.value) {
    case 1: return 'diff-easy';
    case 2: return 'diff-medium';
    case 3: return 'diff-hard';
    default: return '';
  }
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

// 监听游戏状态，看是否轮到AI
watch(() => gameState.value.currentPlayer, async (newPlayer) => {
  if (newPlayer !== selectedSide.value && !gameState.value.gameOver && gameStarted.value) {
    await nextTick();
    setTimeout(() => {
      makeAIMove();
    }, 500); // 给玩家一点时间看到棋盘变化
  }
}, { immediate: false });

const selectDifficulty = (difficulty: 1 | 2 | 3) => {
  selectedDifficulty.value = difficulty;
};

const startGame = () => {
  if (!selectedDifficulty.value || !selectedSide.value) return;
  
  gameStarted.value = true;
  engine.reset();
  
  // 如果玩家选择小兵方，AI先手（大炮方）
  if (selectedSide.value === 'soldier') {
    setTimeout(() => {
      makeAIMove();
    }, 1000);
  }
};

const handleCellClick = (row: number, col: number) => {
  if (!isPlayerTurn.value || aiThinking.value) return;
  
  const cell = gameState.value.board[row]?.[col];
  if (!cell) return;
  
  // 如果点击的是当前玩家的棋子，进行选择
  if (cell.piece === currentPlayer.value) {
    engine.selectPiece({ row, col });
  }
  // 如果已经选中棋子，尝试移动（包括吃子）
  else if (gameState.value.selectedPiece) {
    const success = engine.movePiece({ row, col });
    if (!success) {
      // 移动失败，取消选择
      engine.deselectPiece();
    }
  }
};

const makeAIMove = () => {
  if (!selectedDifficulty.value || gameState.value.gameOver) return;
  
  aiThinking.value = true;
  
  // 模拟AI思考时间（让玩家感觉AI在"思考"）
  const thinkTime = selectedDifficulty.value === 1 ? 300 : 
                    selectedDifficulty.value === 2 ? 800 : 1500;
  
  setTimeout(() => {
    const aiPlayer = currentPlayer.value;
    const move = AIEngine.getBestMove(gameState.value, selectedDifficulty.value as 1 | 2 | 3, aiPlayer);
    
    if (move) {
      // 执行AI的移动
      engine.selectPiece(move.from);
      setTimeout(() => {
        engine.movePiece(move.to);
        aiThinking.value = false;
      }, 200);
    } else {
      aiThinking.value = false;
    }
  }, thinkTime);
};

const resetGame = () => {
  engine.reset();
  if (selectedSide.value === 'soldier') {
    setTimeout(() => {
      makeAIMove();
    }, 1000);
  }
};

const backToMenu = () => {
  gameStarted.value = false;
  selectedDifficulty.value = null;
  selectedSide.value = null;
  engine.reset();
};

const closeModal = () => {
  // 点击遮罩层不关闭
};

const goHome = () => {
  router.push('/');
};
</script>

<style scoped>
.ai-game {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;
}

/* 难度选择界面 */
.difficulty-selector {
  text-align: center;
  max-width: 900px;
  width: 100%;
  animation: slideUp 0.6s ease;
}

.game-title {
  font-size: 64px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #a5a5db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 40px;
  letter-spacing: -2px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
}

.player-selection {
  margin-bottom: 50px;
}

.selection-title {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 24px;
  font-weight: 500;
  letter-spacing: 1px;
}

.player-options {
  display: flex;
  gap: 30px;
  justify-content: center;
  margin-bottom: 30px;
}

.player-option {
  padding: 30px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  min-width: 220px;
  backdrop-filter: blur(10px);
}

.player-option:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.player-option.active {
  border-color: #4ECDC4;
  background: rgba(78, 205, 196, 0.1);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(78, 205, 196, 0.15);
}

.placeholder-piece {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  color: white;
}

.piece-cannon-color {
  background: linear-gradient(135deg, #FF6B35 0%, #D64516 100%);
}

.piece-soldier-color {
  background: linear-gradient(135deg, #4ECDC4 0%, #2DA8A3 100%);
}

.player-name {
  font-size: 22px;
  font-weight: 700;
  color: white;
}

.player-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}

.difficulty-options {
  display: flex;
  gap: 25px;
  justify-content: center;
  margin-bottom: 50px;
}

.difficulty-card {
  padding: 30px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  min-width: 200px;
  backdrop-filter: blur(10px);
}

.difficulty-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.difficulty-card.selected {
  border-color: #4ECDC4;
  background: rgba(78, 205, 196, 0.1);
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(78, 205, 196, 0.15);
}

.difficulty-icon {
  font-size: 56px;
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.difficulty-card h3 {
  color: white;
  font-size: 24px;
  margin-bottom: 10px;
  font-weight: 700;
}

.difficulty-card p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  line-height: 1.5;
}

.btn-start {
  padding: 20px 60px;
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #4ECDC4 0%, #2DA8A3 100%);
  color: white;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 10px 30px rgba(78, 205, 196, 0.3);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.btn-start:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 20px 40px rgba(78, 205, 196, 0.4);
}

.btn-start:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: grayscale(1);
}

.selection-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.btn-back-home {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back-home:hover {
  color: white;
  border-color: white;
  background: rgba(255, 255, 255, 0.1);
}

/* 游戏界面 */
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
}

.game-header {
  text-align: center;
  margin-bottom: 40px;
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
  max-width: 600px;
  margin: 0 auto;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.5;
  transition: all 0.3s ease;
  position: relative;
  padding: 8px 16px;
  border-radius: 16px;
}

.player-card.active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.05);
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

/* 迷你思考动画 */
.mini-thinking {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #4ECDC4;
  border-radius: 10px;
  padding: 4px 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  animation: popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.thinking-dots {
  width: 24px;
  height: 6px;
  background-image: radial-gradient(circle, #000 2px, transparent 2.5px);
  background-size: 8px 100%;
  animation: thinking-dots 1s infinite linear;
}

@keyframes thinking-dots {
  0% { background-position: 0 0; }
  100% { background-position: 8px 0; }
}

@keyframes popIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.vs-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.difficulty-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: rgba(0,0,0,0.7);
  font-weight: 800;
}

.diff-easy { background: #4ecc78; }
.diff-medium { background: #f7b955; }
.diff-hard { background: #ff6b6b; }

.round-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.round-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.4);
}

.round-count {
  font-size: 20px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.8);
}


.game-controls {
  display: flex;
  gap: 20px;
}

.btn {
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  letter-spacing: 0.5px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
  color: white;
  box-shadow: 0 8px 20px rgba(255, 107, 53, 0.25);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Game Over Modal Styles - Same as LocalGame */
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
  padding: 50px;
  border-radius: 30px;
  text-align: center;
  box-shadow: 0 50px 100px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 450px;
  width: 90%;
  animation: slideUp 0.5s ease;
}

.winner-target {
  width: 100px;
  height: 100px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 56px;
  font-weight: 800;
  color: white;
  animation: bounceIn 0.8s ease;
}

.winner-text {
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 30px;
  color: white;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes bounceIn {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
</style>
