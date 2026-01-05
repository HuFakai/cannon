<template>
  <div class="settings-page">
    <div class="back-btn" @click="router.push('/')">
      <span class="icon">←</span> 返回主页
    </div>

    <h1 class="page-title">游戏设置</h1>

    <div class="settings-container">
      <!-- 游戏设置 -->
      <section class="settings-section">
        <h2 class="section-title">游戏偏好</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">显示移动提示</span>
            <span class="setting-desc">落子时显示可移动的位置</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.showMoveHints" @change="saveSetting('showMoveHints')">
            <span class="toggle-slider"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">音效</span>
            <span class="setting-desc">开启游戏音效（开发中）</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.soundEnabled" @change="saveSetting('soundEnabled')" disabled>
            <span class="toggle-slider disabled"></span>
          </label>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">振动反馈</span>
            <span class="setting-desc">移动设备振动反馈（开发中）</span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="settings.vibrationEnabled" @change="saveSetting('vibrationEnabled')" disabled>
            <span class="toggle-slider disabled"></span>
          </label>
        </div>
      </section>

      <!-- 关于 -->
      <section class="settings-section">
        <h2 class="section-title">关于游戏</h2>
        
        <div class="about-card">
          <div class="game-logo">🎯</div>
          <h3 class="game-name">火炮棋</h3>
          <p class="game-version">版本 1.0.0</p>
          <p class="game-desc">
            经典策略博弈游戏，体验大炮与小兵之间的智慧对决。
          </p>
          <div class="tech-stack">
            <span class="tech-tag">Vue 3</span>
            <span class="tech-tag">TypeScript</span>
            <span class="tech-tag">WebSocket</span>
          </div>
        </div>
      </section>

      <!-- 数据管理 -->
      <section class="settings-section">
        <h2 class="section-title">数据管理</h2>
        
        <button class="action-btn danger" @click="clearData">
          清除本地数据
        </button>
        <p class="action-desc">清除所有本地存储的设置和缓存</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 设置状态
const settings = ref({
  showMoveHints: true,
  soundEnabled: false,
  vibrationEnabled: false
});

// 从 localStorage 加载设置
onMounted(() => {
  const saved = localStorage.getItem('cannon-game-settings');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      settings.value = { ...settings.value, ...parsed };
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }
});

// 保存单个设置
const saveSetting = (key: string) => {
  localStorage.setItem('cannon-game-settings', JSON.stringify(settings.value));
};

// 清除本地数据
const clearData = () => {
  if (confirm('确定要清除所有本地数据吗？')) {
    localStorage.removeItem('cannon-game-settings');
    settings.value = {
      showMoveHints: true,
      soundEnabled: false,
      vibrationEnabled: false
    };
    alert('数据已清除');
  }
};
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  padding: 30px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.back-btn {
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  transition: color 0.3s;
  margin-bottom: 30px;
}

.back-btn:hover {
  color: white;
}

.page-title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 40px;
  background: linear-gradient(135deg, #fff 0%, #a5a5db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.settings-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 25px;
}

.section-title {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 16px;
  color: white;
}

.setting-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: 0.3s;
  border-radius: 28px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background: linear-gradient(135deg, #4ECDC4 0%, #2DA8A3 100%);
}

input:checked + .toggle-slider:before {
  transform: translateX(22px);
}

.toggle-slider.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 关于卡片 */
.about-card {
  text-align: center;
  padding: 20px;
}

.game-logo {
  font-size: 48px;
  margin-bottom: 15px;
}

.game-name {
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 5px;
}

.game-version {
  font-size: 14px;
  color: #4ECDC4;
  margin-bottom: 15px;
}

.game-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 20px;
}

.tech-stack {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.tech-tag {
  background: rgba(78, 205, 196, 0.1);
  color: #4ECDC4;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  border: 1px solid rgba(78, 205, 196, 0.2);
}

/* 操作按钮 */
.action-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.action-btn.danger {
  background: rgba(255, 107, 107, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.2);
}

.action-btn.danger:hover {
  background: rgba(255, 107, 107, 0.2);
}

.action-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin-top: 10px;
}
</style>
