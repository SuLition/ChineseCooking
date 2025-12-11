<script setup>
/**
 * 连击显示组件
 * ComboDisplay Component
 */

defineProps({
  combo: {
    type: Number,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})
</script>

<template>
  <div class="combo-display" :class="{ active: visible }">
    🔥 {{ combo }} 连击！
  </div>
</template>

<style scoped>
.combo-display {
  position: fixed;
  top: 150px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 40px;
  color: var(--gold);
  text-shadow: 3px 3px 0 var(--primary-red);
  z-index: var(--z-combo);
  display: none;
}

.combo-display.active {
  display: block;
  animation: combo-pop 0.5s ease-out;
}
</style>
