<template>
  <div class="home-container">
    <div class="content-wrapper">
      <h1 class="game-title">火炮棋</h1>
      <p class="game-subtitle">经典博弈 · 策略对决</p>
      
      <div class="menu-options">
        <div class="menu-card" @click="router.push('/local')">
          <div class="card-image-wrapper">
            <img src="../assets/local_battle.png" alt="本地对战" class="card-image"/>
          </div>
          <div class="card-content">
            <h3>本地双人</h3>
            <p>与好友在同一设备对战</p>
          </div>
        </div>
        
        <div class="menu-card" @click="router.push('/ai')">
          <div class="card-image-wrapper">
            <img src="../assets/ai_battle.png" alt="人机对战" class="card-image"/>
          </div>
          <div class="card-content">
            <h3>人机对战</h3>
            <p>挑战不同难度的AI</p>
          </div>
        </div>

        <div class="menu-card" @click="router.push('/online')">
          <div class="card-image-wrapper">
            <img src="../assets/online_battle.png" alt="联机对战" class="card-image"/>
          </div>
          <div class="card-content">
            <h3>联机对战</h3>
            <p>在线匹配对手实时竞技</p>
          </div>
        </div>
      </div>
      
      <button class="rule-btn" @click="showRules = true">
        <span class="icon">📖</span> 游戏规则
      </button>
      
      <button class="rule-btn settings-btn" @click="router.push('/settings')">
        <span class="icon">⚙️</span> 游戏设置
      </button>
    </div>

    <!-- 规则模态框 -->
    <div v-if="showRules" class="rule-modal" @click="showRules = false">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="showRules = false">×</button>
        <h2>游戏规则</h2>
        <div class="rule-body">
          <section>
            <h3>棋盘与阵营</h3>
            <p>棋盘为6x6格。大炮方（红）2枚棋子，小兵方（绿）18枚棋子。</p>
          </section>
          
          <section>
            <h3>移动规则</h3>
            <p><b>大炮：</b>每次移动一格（上下左右）。</p>
            <p><b>小兵：</b>每次移动一格（上下左右）。</p>
          </section>

          <section>
            <h3>特殊规则：大炮吃子</h3>
            <p>当大炮与小兵在同一直线上且<b>中间隔着一个空格</b>时，大炮可以吃掉该小兵并占据其位置。</p>
          </section>

          <section>
            <h3>胜负条件</h3>
            <p><b>大炮胜：</b>小兵剩余数量少于6个。</p>
            <p><b>小兵胜：</b>大炮被围困无法移动。</p>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const showRules = ref(false);
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.content-wrapper {
  text-align: center;
  max-width: 1200px;
  width: 100%;
  animation: fadeIn 0.8s ease-out;
}

.game-title {
  font-size: 80px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, #a5a5db 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 5px;
  letter-spacing: 5px;
  filter: drop-shadow(0 4px 15px rgba(0,0,0,0.4));
}

.game-subtitle {
  font-size: 24px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 80px;
  letter-spacing: 2px;
  font-weight: 300;
}

.menu-options {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
}

.menu-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 30px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  backdrop-filter: blur(10px);
  width: 280px;
}

.menu-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 30px 60px rgba(0,0,0,0.4);
}

.card-image-wrapper {
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  transition: transform 0.4s ease;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
  border-radius: 20px;
}

.menu-card:hover .card-image-wrapper {
  transform: scale(1.1) rotate(2deg);
}

.card-content h3 {
  font-size: 24px;
  color: white;
  margin-bottom: 8px;
  font-weight: 600;
}

.card-content p {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.rule-btn {
  margin-top: 50px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 30px;
  border-radius: 50px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.rule-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.settings-btn {
  margin-left: 15px;
}

.rule-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background: rgba(30, 30, 40, 0.95);
  padding: 40px;
  border-radius: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: none;
  border: none;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.modal-content h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #4ECDC4;
}

.rule-body section {
  margin-bottom: 25px;
}

.rule-body h3 {
  font-size: 18px;
  color: white;
  margin-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  padding-bottom: 5px;
}

.rule-body p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin-bottom: 8px;
}

/* 移动端响应式 */
@media (max-width: 768px) {
  .game-title {
    font-size: 48px;
    letter-spacing: 2px;
  }
  
  .game-subtitle {
    font-size: 18px;
    margin-bottom: 50px;
  }
  
  .menu-options {
    gap: 20px;
  }
  
  .menu-card {
    width: 100%;
    max-width: 320px;
    padding: 20px;
  }
  
  .card-image-wrapper {
    width: 120px;
    height: 120px;
  }
  
  .rule-btn {
    margin-top: 30px;
    padding: 10px 25px;
    font-size: 14px;
  }
  
  .settings-btn {
    margin-left: 10px;
  }
}

@media (max-width: 480px) {
  .game-title {
    font-size: 32px;
    letter-spacing: 1px;
  }
  
  .game-subtitle {
    font-size: 14px;
    margin-bottom: 25px;
  }
  
  .menu-options {
    gap: 15px;
  }

  .menu-card {
    padding: 15px;
    border-radius: 16px;
    width: 100%;
    max-width: 280px;
  }
  
  .card-image-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .card-content h3 {
    font-size: 18px;
  }
  
  .card-content p {
    font-size: 12px;
  }
  
  .modal-content {
    padding: 20px;
    width: 95%;
  }
  
  .rule-btn,
  .settings-btn {
    width: 100%;
    margin-left: 0;
    margin-top: 15px;
    justify-content: center;
  }
}
</style>
