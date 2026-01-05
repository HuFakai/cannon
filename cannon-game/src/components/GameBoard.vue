<!--
  棋盘组件 - UI重构版
  玻璃拟态风格
-->
<template>
  <div class="board-container">
    <div class="board-frame">
      <div class="game-board">
        <!-- 装饰性背景网格 -->
        <div class="board-grid-bg"></div>
        
        <div 
          v-for="(row, rowIndex) in board" 
          :key="rowIndex" 
          class="board-row"
        >
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            class="board-cell"
            :class="{
              'selected-cell': cell.isSelected,
              'dark-cell': (rowIndex + colIndex) % 2 === 1
            }"
            @click="handleCellClick(rowIndex, colIndex)"
          >
            <!-- 棋子 -->
            <transition name="piece-fade" mode="out-in">
              <Piece 
                v-if="cell.piece" 
                :type="cell.piece" 
                :is-selected="cell.isSelected"
              />
            </transition>
            
            <!-- 选中指示器（替代原来的高亮） -->
            <div v-if="cell.isSelected" class="selection-ring"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineComponent } from 'vue';
import type { Cell } from '../core/types';
import Piece from './Piece.vue';

interface Props {
  board: Cell[][];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  cellClick: [row: number, col: number]
}>();

const handleCellClick = (row: number, col: number) => {
  emit('cellClick', row, col);
};
</script>

<style scoped>
.board-container {
  padding: 20px;
  position: relative;
}

.board-frame {
  padding: 15px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 20px 50px rgba(0, 0, 0, 0.5),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}

.game-board {
  display: inline-block;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.board-row {
  display: flex;
}

.board-cell {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: background-color 0.3s ease;
}

/* 棋盘格交错色 */
.board-cell {
  background: rgba(255, 255, 255, 0.03);
}

.board-cell.dark-cell {
  background: rgba(0, 0, 0, 0.15);
}

.board-cell:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 选中棋子所在的格子样式 */
.board-cell.selected-cell {
  background: rgba(255, 255, 255, 0.12);
}

/* 选中光环 */
.selection-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  animation: ring-pulse 1.5s infinite;
  box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
  pointer-events: none;
}

@keyframes ring-pulse {
  0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.8; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0; }
}

/* 棋子进出动画 */
.piece-fade-enter-active,
.piece-fade-leave-active {
  transition: all 0.3s ease;
}

.piece-fade-enter-from,
.piece-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* 移动端响应式 */
@media (max-width: 600px) {
  .board-container {
    padding: 10px;
  }
  
  .board-frame {
    padding: 10px;
    border-radius: 16px;
  }
  
  .board-cell {
    width: 50px;
    height: 50px;
  }
  
  .selection-ring {
    width: 45px;
    height: 45px;
    border-radius: 8px;
  }
}

@media (max-width: 400px) {
  .board-cell {
    width: 45px;
    height: 45px;
  }
  
  .selection-ring {
    width: 40px;
    height: 40px;
  }
}
</style>
