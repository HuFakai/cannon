<template>
  <div class="online-game">
    <!-- 连接状态/房间选择界面 -->
    <div v-if="!isInRoom" class="room-selector">
      <div class="back-btn" @click="router.push('/')">
        <span class="icon">←</span> 返回主页
      </div>

      <h1 class="page-title">联机对战</h1>

      <div class="action-card create-room" @click="createRoom">
        <div class="action-icon">+</div>
        <div class="action-info">
          <h3>创建房间</h3>
          <p>创建一个新房间并邀请好友加入</p>
         </div>
      </div>

      <div class="divider">或者</div>

      <div class="action-card join-room">
         <div class="input-group">
            <input 
              v-model="roomIdInput" 
              placeholder="输入房间号" 
              maxlength="6"
              @keyup.enter="joinRoom"
            />
            <button @click="joinRoom" :disabled="!roomIdInput">加入</button>
         </div>
         <p class="input-hint">输入6位房间号加入现有对局</p>
      </div>
      
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>

    <!-- 游戏等待/进行界面 -->
    <div v-else class="game-wrapper">
       <div class="game-header">
         <h1 class="room-title">房间号: <span class="highlight-id">{{ currentRoomId }}</span></h1>
         
         <div class="game-stats-bar">
           <!-- 左侧玩家: 这里始终显示大炮方 (为了统一布局，我们逻辑上固定左炮右兵，或者根据 mySide 动态调整?) 
                为了和AIGame一致，我们左边放炮，右边放兵
           -->
           <div class="player-card" :class="{ active: gameState.currentPlayer === 'cannon' }">
             <div class="piece-icon piece-cannon">炮</div>
             <div class="player-info">
                <span class="label">大炮方 {{ mySide === 'cannon' ? '(你)' : '(对手)' }}</span>
                <span class="count">{{ gameState.cannonPositions.length }}</span>
             </div>
             <!-- 思考/连接状态 -->
             <div v-if="!isMyTurn && mySide !== 'cannon' && isOpponentConnected" class="mini-thinking">
                <div class="thinking-dots"></div>
             </div>
           </div>

           <div class="vs-info">
              <span class="difficulty-badge status-badge" :class="{ 'connected': isOpponentConnected }">
                  {{ isOpponentConnected ? '对战中' : '等待连接' }}
              </span>
              <div class="round-info">
                <span class="round-label">Round</span>
                <span class="round-count">{{ Math.floor((gameState.moveHistory.length || 0) / 2) + 1 }}</span>
              </div>
           </div>

           <div class="player-card" :class="{ active: gameState.currentPlayer === 'soldier' }">
             <div class="piece-icon piece-soldier">兵</div>
             <div class="player-info">
                <span class="label">小兵方 {{ mySide === 'soldier' ? '(你)' : '(对手)' }}</span>
                <span class="count">{{ gameState.soldierPositions.length }}</span>
             </div>
             <!-- 思考/连接状态 -->
             <div v-if="!isMyTurn && mySide !== 'soldier' && isOpponentConnected" class="mini-thinking">
                <div class="thinking-dots"></div>
             </div>
           </div>
         </div>
       </div>

       <div v-if="!isGameStarted" class="waiting-screen">
          <div class="waiting-content">
            <div class="spinner"></div>
            <h2>正在等待对手加入...</h2>
            <p>即使分享房间号 {{ currentRoomId }} 给好友</p>
          </div>
       </div>

       <div v-else class="game-area">
          <GameBoard 
            :board="gameState.board" 
            @cell-click="handleCellClick"
          />
       </div>

       <div class="game-controls">
         <button 
           class="btn btn-secondary" 
           @click="requestRematch"
           :disabled="rematchRequested"
         >
           {{ rematchRequested ? '等待对手确认...' : '再来一局' }}
         </button>
         <button class="btn btn-secondary" @click="leaveRoom">离开房间</button>
       </div>

        <!-- 游戏结束弹窗 -->
        <div v-if="gameState.gameOver" class="game-over-modal">
          <div class="modal-content">
            <h2 class="modal-title">游戏结束！</h2>
             <div class="winner-display">
               <p class="winner-text">
                 {{ isWinner ? '恭喜你获胜！' : '遗憾落败...' }}
               </p>
               <p class="reason">{{ gameEndReason }}</p>
             </div>
             <div class="modal-actions column">
               <div v-if="rematchRequested" class="waiting-text">
                  {{ opponentRequestedRematch ? '双方已确认，正在重新开始...' : '已发送请求，等待对手确认...' }}
               </div>
               <div v-else-if="opponentRequestedRematch" class="rematch-alert">
                 对手想再来一局！
               </div>
               
               <button 
                 v-if="!rematchRequested" 
                 @click="requestRematch" 
                 class="btn btn-primary"
                 :class="{ 'pulse': opponentRequestedRematch }"
               >
                 {{ opponentRequestedRematch ? '同意再来一局' : '再来一局' }}
               </button>
               
               <button @click="leaveRoom" class="btn btn-secondary">离开房间</button>
             </div>
          </div>
        </div>
        
        <!-- 游戏进行中的重赛确认弹窗 -->
        <div v-if="!gameState.gameOver && opponentRequestedRematch" class="game-over-modal">
           <div class="modal-content">
              <h2 class="modal-title">对手申请重新开始</h2>
              <p class="modal-subtitle">是否同意结束当前对局并开始新的一局？</p>
              
              <div class="modal-actions">
                 <button 
                   @click="requestRematch" 
                   class="btn btn-primary pulse"
                 >
                   同意
                 </button>
                 <!-- 暂时没有拒绝功能，可以点击遮罩关闭或者忽略，这里提供一个关闭按钮(实际上拒绝逻辑需要协议支持，现在简单处理为关闭弹窗但保留状态? 或者直接不显示拒绝按钮等待用户决定?) 
                      简单起见，如果不想同意，暂时无法明确"拒绝"，只能不点。
                      为了UI友好，还是只提供同意。如果不点，对方就一直等着。
                 -->
              </div>
           </div>
        </div>
    </div>
  </div>

    <!-- 创建房间模态框 -->
    <div v-if="showCreateModal" class="game-over-modal" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">创建房间</h2>
        <p class="modal-subtitle">选择你的阵营</p>
        
        <div class="side-options">
          <div 
            class="side-card" 
            :class="{ active: selectedSide === 'cannon' }"
            @click="selectedSide = 'cannon'"
          >
            <div class="piece-preview piece-cannon">炮</div>
            <span>大炮方</span>
          </div>

          <div 
            class="side-card" 
            :class="{ active: selectedSide === 'soldier' }"
            @click="selectedSide = 'soldier'"
          >
            <div class="piece-preview piece-soldier">兵</div>
            <span>小兵方</span>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="confirmCreateRoom" class="btn btn-primary" :disabled="!selectedSide">确认创建</button>
          <button @click="showCreateModal = false" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { wsClient, MessageType } from '../network/WebSocketClient';
import GameBoard from '../components/GameBoard.vue';
import { GameEngine } from '../core/GameEngine';
import type { GameState, Position } from '../core/types';

const router = useRouter();
const engine = new GameEngine();

// 状态
const isInRoom = ref(false);
const roomIdInput = ref('');
const currentRoomId = ref('');
const errorMessage = ref('');
const isGameStarted = ref(false);
const isOpponentConnected = ref(false);
const mySide = ref<'cannon' | 'soldier' | null>(null);
const gameState = ref<GameState>(engine.getState());
const gameEndReason = ref('');
const showCreateModal = ref(false);
const selectedSide = ref<'cannon' | 'soldier' | null>(null);

const rematchRequested = ref(false);
const opponentRequestedRematch = ref(false);

const opponentSide = computed(() => mySide.value === 'cannon' ? 'soldier' : 'cannon');
const isMyTurn = computed(() => {
   return isGameStarted.value && gameState.value.currentPlayer === mySide.value;
});
const isWinner = computed(() => gameState.value.winner === mySide.value);

// 生命周期
onMounted(async () => {
    try {
        await wsClient.connect();
        setupListeners();
    } catch (e) {
        errorMessage.value = '无法连接到服务器';
    }
});

onUnmounted(() => {
    // 离开时清理
    wsClient.close();
});

function setupListeners() {
    wsClient.on(MessageType.CREATE_ROOM, (payload) => {
        isInRoom.value = true;
        currentRoomId.value = payload.roomId;
        showCreateModal.value = false; // 关闭模态框
    });

    wsClient.on(MessageType.JOIN_ROOM, (payload) => {
        // 加入成功，无论房间状态是 waiting 还是 playing，都进入房间界面
        isInRoom.value = true;
        currentRoomId.value = payload.roomId;
    });

    wsClient.on(MessageType.GAME_START, (payload) => {
        // 游戏开始，收到阵营信息
        isGameStarted.value = true;
        isOpponentConnected.value = true;
        mySide.value = payload.side; // Server assigned side
        
        // 重置游戏及UI状态
        engine.reset();
        gameState.value = engine.getState();
        rematchRequested.value = false;
        opponentRequestedRematch.value = false;
        gameEndReason.value = '';
    });

    wsClient.on(MessageType.MOVE, (payload) => {
        // 收到对手移动
        // payload 是 moveData: { from, to }
        if (payload) {
             // 执行对方的移动（不带验证，直接执行）
             engine.selectPiece(payload.from);
             engine.movePiece(payload.to);
             gameState.value = engine.getState();
        }
    });

    wsClient.on(MessageType.REMATCH_NOTIFY, (payload) => {
        // 对手请求重赛
        opponentRequestedRematch.value = true;
    });
    
    wsClient.on(MessageType.PLAYER_DISCONNECTED, () => {
        isOpponentConnected.value = false; 
        errorMessage.value = '对手已断开连接';
        // 可以在这里显示一个弹窗或自动判胜
        gameEndReason.value = '对手断开连接';
        gameState.value.gameOver = true;
        gameState.value.winner = mySide.value; // 对手掉线我方胜
    });
    
    wsClient.on(MessageType.ERROR, (payload) => {
        errorMessage.value = payload.message;
    });
}

const createRoom = () => {
    showCreateModal.value = true;
    selectedSide.value = null; // 重置选择
};

const confirmCreateRoom = () => {
    if (!selectedSide.value) return;
    wsClient.send(MessageType.CREATE_ROOM, { side: selectedSide.value });
};

const joinRoom = () => {
    if (!roomIdInput.value) return;
    wsClient.send(MessageType.JOIN_ROOM, { roomId: roomIdInput.value });
};

const leaveRoom = () => {
    // 简单处理：刷新页面或断开重连
    router.push('/');
};

const requestRematch = () => {
    rematchRequested.value = true;
    wsClient.send(MessageType.REMATCH_REQUEST, { roomId: currentRoomId.value });
};

const handleCellClick = (row: number, col: number) => {
    if (!isGameStarted.value || !isMyTurn.value || gameState.value.gameOver) return;

    const cell = gameState.value.board[row][col];
    
    // 只允许操作己方棋子
    // Engine Logic: selectPiece only works if cell.piece === currentPlayer
    // Since isMyTurn ensures currentPlayer === mySide, this is safe.

    // 1. Try to select
    if (cell.piece === mySide.value) {
        engine.selectPiece({ row, col });
        gameState.value = engine.getState();
    } 
    // 2. Try to move
    else if (gameState.value.selectedPiece) {
        const from = gameState.value.selectedPiece;
        const success = engine.movePiece({ row, col });
        
        if (success) {
            // 移动成功，发送给服务器
            wsClient.send(MessageType.MOVE, { 
                roomId: currentRoomId.value,
                moveData: { from, to: { row, col } }
            });
            gameState.value = engine.getState();
        } else {
            // 移动失败（点击无效区域），取消选择
            engine.deselectPiece();
            gameState.value = engine.getState();
        }
    }
};

</script>

<style scoped>
.online-game {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  position: relative;
}

.room-selector {
  max-width: 500px;
  width: 100%;
  margin-top: 60px;
  animation: slideUp 0.6s ease;
}

.back-btn {
  position: absolute;
  top: 30px;
  left: 30px;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  transition: color 0.3s;
}

.back-btn:hover {
  color: white;
}

.page-title {
  text-align: center;
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 50px;
}

.action-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.create-room:hover {
  background: rgba(78, 205, 196, 0.1);
  border-color: #4ECDC4;
  transform: translateY(-2px);
}

.action-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 300;
}

.action-info h3 {
  font-size: 20px;
  margin-bottom: 5px;
}

.action-info p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.divider {
  text-align: center;
  color: rgba(255, 255, 255, 0.3);
  margin: 30px 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.input-group {
  display: flex;
  gap: 15px;
  width: 100%;
}

.input-group input {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 15px 20px;
  border-radius: 12px;
  color: white;
  font-size: 18px;
  outline: none;
  font-family: inherit;
  text-align: center;
  letter-spacing: 2px;
}

.input-group input:focus {
  border-color: #4ECDC4;
}

.input-group button {
  padding: 0 30px;
  background: #4ECDC4;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.input-group button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.join-room {
  flex-direction: column;
  cursor: default;
}

.input-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 10px;
}

.error-message {
  color: #ff6b6b;
  text-align: center;
  margin-top: 20px;
}

/* 游戏内界面 */
.game-wrapper {
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 游戏内头部样式 */
.game-header {
  width: 100%;
  text-align: center;
  margin-bottom: 20px;
}

.room-title {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 20px;
}

.highlight-id {
  color: #4ECDC4;
  font-weight: 700;
  font-size: 20px;
  margin-left: 10px;
}

/* 统计栏样式 (复用自 AIGame) */
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

.status-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  color: rgba(255,255,255,0.7);
  background: #666;
  font-weight: 800;
}

.status-badge.connected {
  background: #4ecc78;
  color: #fff;
}

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
  margin-top: 30px;
  display: flex;
  gap: 15px;
  align-items: center;
}

.leave-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 24px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.leave-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: white;
}
.waiting-screen {
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4ECDC4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

/* 模态框样式 */
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
}

.modal-content {
  background: rgba(30, 30, 40, 0.95);
  padding: 40px;
  border-radius: 24px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%);
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 阵营选择样式 */
.modal-subtitle {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 30px;
}

.side-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 30px;
}

.side-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.side-card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-5px);
}

.side-card.active {
  background: rgba(78, 205, 196, 0.1);
  border-color: #4ECDC4;
  box-shadow: 0 0 20px rgba(78, 205, 196, 0.2);
}

.side-card span {
  font-weight: 600;
  color: white;
}

.piece-preview {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: white;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.piece-cannon {
  background: linear-gradient(135deg, #FF6B35 0%, #D64516 100%);
}

.piece-soldier {
  background: linear-gradient(135deg, #4ECDC4 0%, #2DA8A3 100%);
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  padding: 12px 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-actions.column {
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.waiting-text {
  color: #4ECDC4;
  margin-bottom: 15px;
  font-size: 14px;
}

.rematch-alert {
  color: #f7b955;
  margin-bottom: 10px;
  font-weight: bold;
  animation: bounce 0.5s infinite alternate;
}

.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(78, 205, 196, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(78, 205, 196, 0); }
  100% { box-shadow: 0 0 0 0 rgba(78, 205, 196, 0); }
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-4px); }
}
</style>
