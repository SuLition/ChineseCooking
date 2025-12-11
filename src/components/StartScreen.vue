<script setup>
/**
 * 开始界面组件
 * StartScreen Component
 */

defineEmits(['start'])
</script>

<template>
  <div class="start-screen">
    <div class="start-decoration">🥢🍜🥟</div>
    <div class="game-logo">中华料理传奇</div>
    <div class="game-subtitle">Chinese Cuisine Legend</div>
    <button class="start-btn" @click="$emit('start')">开始营业</button>
    <div class="instructions">选择顾客 → 选择食材 → 点击烹饪台 → 服务顾客 → 升级厨房</div>
  </div>
</template>

<style scoped>
.start-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at center, #3d2a1f 0%, #1a0f0a 100%);
  z-index: var(--z-start-screen);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.start-decoration {
  font-size: 80px;
  margin-bottom: 30px;
}

.game-logo {
  font-size: 56px;
  color: var(--gold);
  text-shadow: 
    4px 4px 0 var(--primary-red),
    -2px -2px 0 #000;
  margin-bottom: 20px;
  animation: logo-pulse 2s ease-in-out infinite;
}

.game-subtitle {
  font-size: 24px;
  color: var(--text-light);
  margin-bottom: 50px;
  opacity: 0.8;
}

.start-btn {
  background: linear-gradient(180deg, var(--primary-red) 0%, #8b1225 100%);
  border: 4px solid var(--gold);
  color: var(--text-light);
  font-family: var(--font-chinese),serif;
  font-size: 28px;
  padding: 15px 60px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  animation: btn-glow 1.5s ease-in-out infinite;
}

.start-btn:hover {
  transform: scale(1.1);
}

.instructions {
  position: absolute;
  bottom: 30px;
  color: var(--text-light);
  opacity: 0.6;
  font-size: 14px;
}
</style>
