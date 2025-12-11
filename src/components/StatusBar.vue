<script setup>
/**
 * 顶部状态栏组件
 */
defineProps({
  money: { type: Number, default: 0 },
  reputation: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  timePeriodName: { type: String, default: '' },
  formattedTime: { type: String, default: '' },
  dailyServed: { type: Number, default: 0 },
  dailyGoal: { type: Number, default: 0 },
  dailyMoneyGoal: { type: Number, default: 0 },
  goalProgress: { type: Number, default: 0 },
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['open-shop', 'close-shop', 'show-shop-panel', 'show-upgrade-panel', 'show-sound-panel', 'toggle-debug'])
</script>

<template>
  <div class="status-bar">
    <div class="stat-box">
      <div class="stat-icon">💰</div>
      <div>
        <div class="stat-label">金币</div>
        <div class="stat-value">{{ money }}</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon">⭐</div>
      <div>
        <div class="stat-label">声望</div>
        <div class="stat-value">{{ reputation }}</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon">📊</div>
      <div>
        <div class="stat-label">等级</div>
        <div class="stat-value">{{ level }}</div>
      </div>
    </div>
    <div class="stat-box">
      <div class="stat-icon">🌅</div>
      <div>
        <div class="stat-label">{{ timePeriodName }}</div>
        <div class="stat-value">{{ formattedTime }}</div>
      </div>
    </div>
    <div class="stat-box goal-box">
      <div class="stat-icon">🎯</div>
      <div class="goal-info">
        <div class="goal-text">今日: {{ dailyServed }}/{{ dailyGoal }} 💰{{ dailyMoneyGoal }}</div>
        <div class="goal-bar-mini">
          <div class="goal-fill-mini" :style="{ width: goalProgress + '%' }"></div>
        </div>
      </div>
    </div>
    <div class="status-buttons">
      <!-- 开店/打烊按钮 -->
      <button 
        v-if="!isOpen" 
        class="btn-small btn-open" 
        @click="emit('open-shop')"
      >
        🏮 开店
      </button>
      <button 
        v-else 
        class="btn-small btn-close" 
        @click="emit('close-shop')"
      >
        🌙 打烊
      </button>
      <button class="btn-small btn-shop" @click="emit('show-shop-panel')">🏪 进货</button>
      <button class="btn-small" @click="emit('show-upgrade-panel')">🔧 升级</button>
      <button class="btn-small" @click="emit('show-sound-panel')">🔊 音效</button>
      <button class="btn-small btn-debug" @click="emit('toggle-debug')">🐛 调试</button>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  height: 60px;
  background: linear-gradient(180deg, var(--dark-wood) 0%, #3a2a1f 100%);
  border-bottom: 3px solid var(--light-wood);
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 15px;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid var(--light-wood);
}

.stat-icon {
  font-size: 20px;
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
}

.stat-value {
  font-size: 16px;
  font-weight: bold;
  color: var(--gold);
}

.status-buttons {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

.btn-small {
  padding: 8px 16px;
  border: 2px solid var(--light-wood);
  border-radius: 8px;
  background: linear-gradient(180deg, #4a3a2f 0%, #3a2a1f 100%);
  color: var(--text-light);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-small:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
}

.btn-open {
  background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%) !important;
  animation: glow-green 1.5s ease-in-out infinite;
}

.btn-close {
  background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%) !important;
}

.btn-shop {
  background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%) !important;
}

.btn-shop:hover {
  box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
}

.btn-debug {
  background: linear-gradient(180deg, #6366f1 0%, #4f46e5 100%) !important;
}

.btn-debug:hover {
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.6);
}

@keyframes glow-green {
  0%, 100% { box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.8); }
}

.goal-box {
  border-color: var(--warning-orange);
}

.goal-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.goal-text {
  font-size: 11px;
  color: var(--text-light);
}

.goal-bar-mini {
  width: 100px;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.goal-fill-mini {
  height: 100%;
  background: linear-gradient(90deg, var(--warning-orange), var(--gold));
  transition: width 0.3s;
}
</style>
