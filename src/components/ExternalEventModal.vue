<script setup>
/**
 * 外部事件弹窗组件
 * 显示来访者事件和选项
 */
import { computed } from 'vue'

const props = defineProps({
  event: {
    type: Object,
    default: null
  },
  timeLeft: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select-option', 'close'])

// 是否显示
const isVisible = computed(() => props.event !== null)

// 倒计时百分比
const timePercent = computed(() => {
  if (!props.event) return 100
  return (props.timeLeft / props.event.duration) * 100
})

// 倒计时颜色
const timeColor = computed(() => {
  if (timePercent.value > 50) return '#4ade80'
  if (timePercent.value > 25) return '#fbbf24'
  return '#ef4444'
})

// 倒计时秒数
const timeLeftSeconds = computed(() => Math.ceil(props.timeLeft / 1000))

function handleOptionClick(optionId) {
  emit('select-option', optionId)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="external-event-overlay">
        <div class="external-event-modal">
          <!-- 倒计时条 -->
          <div class="countdown-bar">
            <div 
              class="countdown-fill" 
              :style="{ width: timePercent + '%', background: timeColor }"
            ></div>
            <span class="countdown-text">{{ timeLeftSeconds }}s</span>
          </div>
          
          <!-- 事件头部 -->
          <div class="event-header">
            <span class="event-icon">{{ event.icon }}</span>
            <h2 class="event-title">{{ event.name }}</h2>
          </div>
          
          <!-- 事件描述 -->
          <p class="event-description">{{ event.description }}</p>
          
          <!-- 选项列表 -->
          <div class="options-list">
            <button
              v-for="option in event.options"
              :key="option.id"
              class="option-btn"
              @click="handleOptionClick(option.id)"
            >
              <span class="option-text">{{ option.text }}</span>
              <span v-if="option.description" class="option-desc">{{ option.description }}</span>
              <span v-if="option.cost" class="option-cost">💰 {{ option.cost }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.external-event-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.external-event-modal {
  background: linear-gradient(135deg, #2d1f1a 0%, #1a0f0a 100%);
  border: 3px solid #8b7355;
  border-radius: 16px;
  padding: 0;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

/* 倒计时条 */
.countdown-bar {
  height: 8px;
  background: #333;
  position: relative;
}

.countdown-fill {
  height: 100%;
  transition: width 0.1s linear, background 0.3s;
}

.countdown-text {
  position: absolute;
  right: 10px;
  top: 12px;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 事件头部 */
.event-header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px 25px 10px;
}

.event-icon {
  font-size: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.event-title {
  font-size: 24px;
  font-weight: bold;
  color: #ffd700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* 事件描述 */
.event-description {
  padding: 0 25px 20px;
  font-size: 16px;
  color: #f5e6d3;
  line-height: 1.5;
  margin: 0;
}

/* 选项列表 */
.options-list {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-btn {
  background: linear-gradient(135deg, #3d2f2a 0%, #2d1f1a 100%);
  border: 2px solid #8b7355;
  border-radius: 10px;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}

.option-btn:hover {
  border-color: #ffd700;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 215, 0, 0.2);
}

.option-btn:active {
  transform: translateY(0);
}

.option-text {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.option-desc {
  font-size: 12px;
  color: #a0a0a0;
}

.option-cost {
  font-size: 12px;
  color: #fbbf24;
  margin-top: 3px;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .external-event-modal,
.modal-leave-to .external-event-modal {
  transform: scale(0.9) translateY(-20px);
}
</style>
