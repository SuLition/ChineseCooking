<script setup>
/**
 * 顾客列表组件 - 封装顾客卡片列表和动画
 */
import CustomerCard from './CustomerCard.vue'

defineProps({
  customers: {
    type: Array,
    default: () => []
  },
  selectedCustomerIndex: {
    type: Number,
    default: -1
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'serve-dish'])
</script>

<template>
  <div class="customer-list">
    <div class="customer-scroll">
      <!-- 未开店提示 -->
      <div v-if="!isOpen" class="empty-hint">
        🏮 点击"开店"开始营业
      </div>
      <!-- 无顾客提示 -->
      <div v-else-if="customers.length === 0" class="empty-hint">
        ⏳ 等待顾客中...
      </div>
      <!-- 顾客卡片列表 -->
      <div class="customer-cards">
        <CustomerCard
          v-for="(customer, index) in customers"
          :key="customer.id"
          :customer="customer"
          :selected="selectedCustomerIndex === index"
          @select="emit('select', index)"
          @serve-dish="(plateIndex, cust) => emit('serve-dish', plateIndex, cust)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.customer-list {
  height: 170px;
  background: linear-gradient(180deg, #1a0f0a 0%, #2d1f1a 100%);
  border-bottom: 3px solid var(--light-wood);
  overflow: hidden;
}

.customer-scroll {
  display: flex;
  gap: 15px;
  padding: 10px 15px;
  overflow-x: auto;
  height: 100%;
  align-items: center;
}

.customer-cards {
  display: flex;
  gap: 15px;
  align-items: center;
}

.empty-hint {
  width: 100%;
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
  padding: 20px;
}
</style>
