<script setup>
/**
 * Toast 提示组件
 * Toast Component
 */

defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'success',
    validator: (value) => ['success', 'error', 'money', 'perfect'].includes(value)
  }
})
</script>

<template>
  <div class="toast" :class="type">
    {{ message }}
  </div>
</template>

<style scoped>
.toast {
  position: fixed;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 18px;
  z-index: var(--z-toast);
  animation: toast-in 0.3s ease-out, toast-out 0.3s ease-in 1.7s forwards;
}

.toast.success {
  background: var(--success-green);
  color: #000;
  border: 3px solid #22c55e;
}

.toast.error {
  background: var(--primary-red);
  color: var(--text-light);
}

.toast.money {
  background: var(--gold);
  color: #000;
}

.toast.perfect {
  background: var(--perfect-purple);
  color: var(--text-light);
  font-size: 24px;
}
</style>
