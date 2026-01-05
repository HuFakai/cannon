<!--
  棋子组件 - UI重构版
  使用CSS3实现3D立体感和高级光效
-->
<template>
  <div 
    class="piece-container" 
    :class="[`type-${type}`, { 'is-selected': isSelected }]"
  >
    <div class="piece-glow"></div>
    <div class="piece-body">
      <div class="piece-surface">
        <div class="piece-icon">{{ displayText }}</div>
        <div class="piece-shine"></div>
      </div>
      <div class="piece-side"></div>
    </div>
    <div class="piece-shadow"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PieceType } from '../core/types';

interface Props {
  type: PieceType;
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
});

const displayText = computed(() => {
  return props.type === 'cannon' ? '炮' : '兵';
});
</script>

<style scoped>
.piece-container {
  width: 68px;
  height: 68px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  perspective: 1000px;
}

/* 悬停效果 */
.piece-container:hover {
  transform: translateY(-5px) scale(1.05);
  z-index: 10;
}

/* 选中状态 */
.piece-container.is-selected {
  transform: translateY(-8px) scale(1.1);
  z-index: 20;
}

.piece-container.is-selected .piece-glow {
  opacity: 1;
  animation: glow-pulse 2s infinite;
}

/* 阴影 */
.piece-shadow {
  position: absolute;
  bottom: 0px;
  width: 50px;
  height: 10px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  filter: blur(4px);
  transition: all 0.3s ease;
  z-index: -1;
}

.piece-container:hover .piece-shadow {
  width: 55px;
  opacity: 0.4;
  transform: translateY(5px);
}

.piece-container.is-selected .piece-shadow {
  width: 60px;
  opacity: 0.3;
  transform: translateY(8px) scale(0.8);
}

/* 光晕 */
.piece-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
  filter: blur(10px);
}

.type-cannon .piece-glow {
  background: radial-gradient(circle, rgba(255, 107, 53, 0.6) 0%, transparent 70%);
}

.type-soldier .piece-glow {
  background: radial-gradient(circle, rgba(78, 205, 196, 0.6) 0%, transparent 70%);
}

/* 棋子主体 */
.piece-body {
  width: 60px;
  height: 60px;
  position: relative;
  transform-style: preserve-3d;
}

.piece-surface {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    inset 0 2px 5px rgba(255, 255, 255, 0.4),
    inset 0 -2px 5px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 大炮配色 */
.type-cannon .piece-surface {
  background: linear-gradient(135deg, #FF6B35 0%, #D64516 100%);
  box-shadow: 
    0 4px 10px rgba(214, 69, 22, 0.4),
    inset 0 3px 6px rgba(255, 255, 255, 0.3),
    inset 0 -3px 6px rgba(0, 0, 0, 0.2);
}

/* 小兵配色 */
.type-soldier .piece-surface {
  background: linear-gradient(135deg, #4ECDC4 0%, #2DA8A3 100%);
  box-shadow: 
    0 4px 10px rgba(45, 168, 163, 0.4),
    inset 0 3px 6px rgba(255, 255, 255, 0.3),
    inset 0 -3px 6px rgba(0, 0, 0, 0.2);
}

/* 文字图标 */
.piece-icon {
  font-size: 28px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  z-index: 2;
  font-family: 'Kaiti SC', 'STKaiti', 'KaiTi', serif; /* 使用楷体更有棋子韵味 */
}

/* 高光泽 */
.piece-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
  border-radius: 50% 50% 0 0;
  pointer-events: none;
}

@keyframes glow-pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.8;
  }
}

/* 移动端响应式 */
@media (max-width: 600px) {
  .piece-container {
    width: 45px;
    height: 45px;
  }
  
  .piece-body {
    width: 40px;
    height: 40px;
  }
  
  .piece-icon {
    font-size: 20px;
  }
  
  .piece-shadow {
    width: 35px;
    height: 8px;
  }
  
  .piece-glow {
    width: 55px;
    height: 55px;
  }
}

@media (max-width: 400px) {
  .piece-container {
    width: 40px;
    height: 40px;
  }
  
  .piece-body {
    width: 35px;
    height: 35px;
  }
  
  .piece-icon {
    font-size: 18px;
  }
}
</style>
