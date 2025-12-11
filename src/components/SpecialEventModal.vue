<script setup>
/**
 * 特殊事件面板组件
 * SpecialEventModal Component
 */

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  event: {
    type: Object,
    default: null
  }
})

defineEmits(['option-click'])
</script>

<template>
  <div class="special-event" :class="{ active: visible && event }">
    <template v-if="event">
      <div class="event-icon">{{ event.icon }}</div>
      <div class="event-title">{{ event.title }}</div>
      <div class="event-desc">{{ event.desc }}</div>
      <div class="event-buttons">
        <button 
          v-for="(option, index) in event.options" 
          :key="index"
          class="event-btn"
          :class="{ 
            positive: index === 0 && !option.negative,
            negative: option.negative,
            neutral: index > 0 && !option.negative
          }"
          @click="$emit('option-click', index)"
        >
          {{ option.text }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.special-event {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(180deg, #3a2a1f 0%, #1a0f0a 100%);
  border: 6px solid var(--perfect-purple);
  border-radius: 16px;
  padding: 30px;
  z-index: var(--z-event);
  display: none;
  text-align: center;
  min-width: 400px;
}

.special-event.active {
  display: block;
  animation: event-popup 0.5s ease-out;
}

.event-icon {
  font-size: 80px;
  margin-bottom: 15px;
  animation: event-bounce 1s ease-in-out infinite;
}

.event-title {
  font-size: 28px;
  color: var(--gold);
  margin-bottom: 10px;
}

.event-desc {
  font-size: 16px;
  color: var(--text-light);
  margin-bottom: 20px;
}

.event-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.event-btn {
  padding: 12px 25px;
  font-family: var(--font-chinese);
  font-size: 16px;
  border: 3px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.event-btn:hover {
  transform: scale(1.05);
}

.event-btn.positive {
  background: var(--success-green);
  border-color: #22c55e;
  color: #000;
}

.event-btn.negative {
  background: var(--primary-red);
  border-color: #ff6b6b;
  color: var(--text-light);
}

.event-btn.neutral {
  background: var(--gold);
  border-color: #ffa500;
  color: #000;
}
</style>
