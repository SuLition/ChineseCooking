<script setup>
/**
 * 顾客卡片组件 - 新版布局
 */
import { ref, computed } from 'vue'

const props = defineProps({
  customer: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'serve-dish'])

// 拖放悬停状态
const isDragOver = ref(false)

// 是否正在用餐
const isEating = computed(() => props.customer.status === 'eating')

// 根据状态计算心情表情
function getMood(customer) {
  if (customer.status === 'eating') return '😋'
  const percent = (customer.patience / customer.maxPatience) * 100
  if (percent < 30) return '😠'
  if (percent < 60) return '😐'
  return '😊'
}

// 拖放事件处理
function handleDragOver(e) {
  const data = e.dataTransfer.types.includes('text/plain')
  if (data) {
    e.preventDefault()
    isDragOver.value = true
  }
}

function handleDragLeave() {
  isDragOver.value = false
}

function handleDrop(e) {
  e.preventDefault()
  isDragOver.value = false
  
  const data = e.dataTransfer.getData('text/plain')
  if (data.startsWith('plate:')) {
    const plateIndex = parseInt(data.replace('plate:', ''))
    emit('serve-dish', plateIndex, props.customer)
  }
}
</script>

<template>
  <div 
    class="customer-card"
    :class="{ 
      selected, 
      special: customer.special,
      'drag-over': isDragOver,
      'eating': isEating
    }"
    @click="$emit('select')"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 顶部：头像区域 -->
    <div class="avatar-section">
      <!-- 大头像 -->
      <div class="avatar-box" :class="{ eating: isEating }">
        <img v-if="customer.image" :src="customer.image" class="avatar-img" />
        <span v-else class="avatar-icon">{{ customer.icon }}</span>
        <span class="customer-type">{{ customer.name || '顾客' }}</span>
      </div>
      <!-- 表情（右侧） -->
      <div class="mood-icon">{{ getMood(customer) }}</div>
    </div>
    
    <!-- 中间：订单信息 -->
    <div class="order-section">
      <!-- 菜品图片 -->
      <div class="dish-icon-box">
        <img v-if="customer.dishImage" :src="customer.dishImage" class="dish-img" />
        <span v-else class="dish-emoji">{{ customer.dishIcon }}</span>
      </div>
      
      <!-- 右侧信息 -->
      <div class="order-info">
        <!-- 菜品名称 / 用餐中 -->
        <div class="dish-name" :class="{ eating: isEating }">
          {{ isEating ? '用餐中' : customer.dish }}
        </div>
        <!-- 小费金额 -->
        <div class="reward-row">
          <span class="reward-icon">💰</span>
          <span class="reward-value">{{ customer.reward }}</span>
          <span v-if="customer.tipMultiplier > 1" class="tip-multiplier">x{{ customer.tipMultiplier.toFixed(1) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 底部：进度条 -->
    <div class="progress-section">
      <div class="progress-bar" :class="{ eating: isEating }">
        <div 
          v-if="isEating"
          class="progress-fill eating-fill"
          :style="{ width: (customer.eatingProgress || 0) + '%' }"
        ></div>
        <div 
          v-else
          class="progress-fill patience-fill"
          :class="{ low: (customer.patience / customer.maxPatience) < 0.3 }"
          :style="{ width: (customer.patience / customer.maxPatience * 100) + '%' }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 卡片容器 */
.customer-card {
  width: 140px;
  background: rgba(0, 0, 0, 0.5);
  border: 2px solid var(--light-wood);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 6px;
  flex-shrink: 0;
  transition: all 0.2s;
  cursor: pointer;
  box-sizing: border-box;
}

.customer-card:hover {
  transform: scale(1.03);
  border-color: var(--gold);
}

.customer-card.selected {
  border-color: var(--success-green);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.5);
}

.customer-card.special {
  border-color: var(--perfect-purple);
  animation: special-glow 1s ease-in-out infinite;
}

.customer-card.drag-over {
  border-color: var(--success-green);
  background: rgba(74, 222, 128, 0.2);
  box-shadow: 0 0 20px rgba(74, 222, 128, 0.6);
}

.customer-card.eating {
  border-color: var(--success-green);
}

/* 头像区域 */
.avatar-section {
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.avatar-box {
  flex: 1;
  background: #3d2a1f;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.avatar-box.eating {
  background: var(--success-green);
  animation: eating-pulse 0.8s ease-in-out infinite;
}

.avatar-img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 4px;
}

.avatar-icon {
  font-size: 32px;
  line-height: 1;
}

.customer-type {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4px;
  font-family: var(--font-pixel);
}

.mood-icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* 订单信息区 */
.order-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dish-icon-box {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dish-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.dish-emoji {
  font-size: 28px;
}

.order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.dish-name {
  font-size: 11px;
  color: #fff;
  font-weight: bold;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-name.eating {
  color: var(--success-green);
  animation: blink-text 1s ease-in-out infinite;
}

.reward-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
}

.reward-icon {
  font-size: 12px;
}

.reward-value {
  color: var(--gold);
  font-weight: bold;
}

.tip-multiplier {
  background: var(--success-green);
  color: #000;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
}

@keyframes blink-text {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 进度条区域 */
.progress-section {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar.eating {
  background: rgba(74, 222, 128, 0.3);
}

.progress-fill {
  height: 100%;
  transition: width 0.1s linear;
}

.patience-fill {
  background: linear-gradient(90deg, var(--primary-red), var(--gold));
}

.patience-fill.low {
  background: var(--primary-red);
  animation: pulse-red 0.5s ease-in-out infinite;
}

.eating-fill {
  background: linear-gradient(90deg, var(--success-green), #86efac);
}

@keyframes eating-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

@keyframes pulse-red {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes special-glow {
  0%, 100% { box-shadow: 0 0 10px var(--perfect-purple); }
  50% { box-shadow: 0 0 20px var(--perfect-purple); }
}
</style>
