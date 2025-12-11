<script setup>
/**
 * 成就提示组件
 * Achievement Component
 */

defineProps({
  icon: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="achievement">
    <div class="achievement-icon">{{ icon }}</div>
    <div class="achievement-text">
      <div class="achievement-title">{{ title }}</div>
      <div class="achievement-desc">{{ desc }}</div>
    </div>
  </div>
</template>

<style scoped>
.achievement {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(180deg, #4a3728 0%, #2d1f1a 100%);
  border: 3px solid var(--gold);
  border-radius: 12px;
  padding: 15px 20px;
  z-index: var(--z-toast);
  display: flex;
  align-items: center;
  gap: 15px;
  animation: achievement-in 0.5s ease-out, achievement-out 0.5s ease-in 2.5s forwards;
}

.achievement-icon {
  font-size: 40px;
}

.achievement-text {
  color: var(--text-light);
}

.achievement-title {
  font-size: 16px;
  color: var(--gold);
}

.achievement-desc {
  font-size: 12px;
}
</style>
