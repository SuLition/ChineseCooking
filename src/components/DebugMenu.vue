<script setup>
/**
 * 调试菜单组件
 */
defineProps({
  visible: { type: Boolean, default: false },
  customerSpawnEnabled: { type: Boolean, default: true },
  customerCount: { type: Number, default: 0 },
  dishList: { type: Array, default: () => [] }
})

const emit = defineEmits(['toggle-spawn', 'spawn-customer', 'spawn-dish'])

import { ref } from 'vue'
const selectedDish = ref('')

function handleSpawnDish() {
  if (selectedDish.value) {
    emit('spawn-dish', selectedDish.value)
  }
}
</script>

<template>
  <div v-if="visible" class="debug-menu">
    <div class="debug-title">🐛 调试工具</div>
    <div class="debug-item">
      <span>顾客生成</span>
      <button 
        class="debug-toggle" 
        :class="{ active: customerSpawnEnabled }"
        @click="emit('toggle-spawn')"
      >
        {{ customerSpawnEnabled ? '开启' : '关闭' }}
      </button>
    </div>
    <div class="debug-item">
      <span>随机生成</span>
      <button class="debug-btn" @click="emit('spawn-customer')">🎲 随机顾客</button>
    </div>
    <div class="debug-item-col">
      <div class="debug-label">🍳 手动生成菜品</div>
      <div class="debug-dish-row">
        <select v-model="selectedDish" class="debug-select">
          <option value="">选择菜品...</option>
          <option v-for="dish in dishList" :key="dish.id" :value="dish.id">
            {{ dish.icon }} {{ dish.name }} (等级{{ dish.unlockLevel }})
          </option>
        </select>
        <button class="debug-btn" @click="handleSpawnDish">生成</button>
      </div>
    </div>
    <div class="debug-info">
      <div>当前顾客数: {{ customerCount }}</div>
    </div>
  </div>
</template>

<style scoped>
.debug-menu {
  position: fixed;
  top: 70px;
  right: 20px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border: 3px solid #6366f1;
  border-radius: 12px;
  padding: 15px;
  z-index: 500;
  min-width: 220px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.debug-title {
  font-size: 16px;
  color: #a5b4fc;
  font-weight: bold;
  padding-bottom: 10px;
  border-bottom: 2px solid #4f46e5;
  margin-bottom: 10px;
}

.debug-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  color: #e0e7ff;
  font-size: 14px;
}

.debug-toggle {
  padding: 5px 15px;
  border: 2px solid #ef4444;
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.debug-toggle.active {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.debug-btn {
  padding: 5px 12px;
  border: 2px solid #6366f1;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.debug-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.4);
  transform: scale(1.05);
}

.debug-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.debug-info {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #4f46e5;
  font-size: 12px;
  color: #94a3b8;
}

.debug-info div {
  padding: 3px 0;
}

.debug-item-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid #4f46e5;
  border-bottom: 1px solid #4f46e5;
  margin: 5px 0;
}

.debug-label {
  color: #a5b4fc;
  font-size: 13px;
}

.debug-dish-row {
  display: flex;
  gap: 8px;
}

.debug-select {
  flex: 1;
  padding: 6px 10px;
  background: rgba(99, 102, 241, 0.2);
  border: 2px solid #6366f1;
  border-radius: 6px;
  color: #e0e7ff;
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.debug-select:focus {
  border-color: #a5b4fc;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

.debug-select option {
  background: #1a1a2e;
  color: #e0e7ff;
}
</style>
