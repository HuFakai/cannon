<script setup lang="ts">
// 路由视图由 vue-router 管理
</script>

<template>
  <router-view />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: radial-gradient(circle at top right, #2d1b4e 0%, #0f0c29 40%, #000000 100%);
  color: #ffffff;
  min-height: 100vh;
  overflow-x: hidden;
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 移动端适配 */
@media (max-width: 768px) {
  body {
    font-size: 14px;
  }
  
  /* 防止双击缩放 */
  * {
    touch-action: manipulation;
  }
}

@media (max-width: 480px) {
  body {
    font-size: 13px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  /* 增大可点击区域 */
  button, .clickable {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* 禁用长按菜单 */
  * {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
  
  /* 允许输入框选择 */
  input, textarea {
    -webkit-user-select: text;
    user-select: text;
  }
}

/* 安全区域适配 (iPhone X等) */
@supports (padding: max(0px)) {
  body {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
</style>
