<script setup>
/**
 * 订单列表组件
 */
import { rawIngredients, preparedIngredients, seasonings } from '../game/data/ingredients'

defineProps({
  customers: { type: Array, default: () => [] },
  selectedCustomerIndex: { type: Number, default: -1 },
  currentCustomer: { type: Object, default: null }
})

const emit = defineEmits(['select-customer'])

// 获取配方项的信息
function getRecipeItemInfo(item) {
  let info = null
  if (item.type === 'prepared') {
    info = preparedIngredients[item.id]
  } else if (item.type === 'seasoning') {
    info = seasonings[item.id]
  } else if (item.type === 'raw') {
    info = rawIngredients[item.id]
  }
  return info || { name: item.id, icon: '❓' }
}

// 获取配方类型的颜色class
function getRecipeTypeClass(type) {
  return `recipe-${type}`
}
</script>

<template>
  <div class="order-list">
    <div class="section-title">📝 订单列表</div>
    <div class="orders-scroll">
      <!-- 当前订单 -->
      <div v-if="currentCustomer" class="order-item active">
        <!-- 菜品信息 -->
        <div class="order-dish-header">
          <div class="dish-icon-large">
            <img v-if="currentCustomer.dishImage" :src="currentCustomer.dishImage" class="dish-image" />
            <span v-else>{{ currentCustomer.dishIcon }}</span>
          </div>
          <div class="dish-info">
            <div class="dish-name">{{ currentCustomer.dish }}</div>
            <div class="dish-price">💰 {{ currentCustomer.reward }}</div>
          </div>
        </div>
        
        <!-- 所需配方 -->
        <div class="order-ingredients">
          <div class="ingredients-list">
            <div 
              v-for="(item, i) in currentCustomer.recipe" 
              :key="i"
              class="ingredient-item"
              :class="getRecipeTypeClass(item.type)"
              :title="getRecipeItemInfo(item).name"
            >
              <img v-if="getRecipeItemInfo(item).image" :src="getRecipeItemInfo(item).image" class="ingredient-img" />
              <span v-else class="ingredient-icon">{{ getRecipeItemInfo(item).icon }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 等待中的订单 -->
      <div 
        v-for="(customer, index) in customers.filter((c, i) => i !== selectedCustomerIndex)"
        :key="customer.id"
        class="order-item pending"
        @click="emit('select-customer', customers.indexOf(customer))"
      >
        <!-- 菜品信息 -->
        <div class="order-dish-header">
          <div class="dish-icon-large">
            <img v-if="customer.dishImage" :src="customer.dishImage" class="dish-image" />
            <span v-else>{{ customer.dishIcon }}</span>
          </div>
          <div class="dish-info">
            <div class="dish-name">{{ customer.dish }}</div>
            <div class="dish-price">💰 {{ customer.reward }}</div>
          </div>
        </div>
        
        <!-- 所需配方 -->
        <div class="order-ingredients">
          <div class="ingredients-list">
            <div 
              v-for="(item, i) in customer.recipe" 
              :key="i"
              class="ingredient-item"
              :class="getRecipeTypeClass(item.type)"
              :title="getRecipeItemInfo(item).name"
            >
              <img v-if="getRecipeItemInfo(item).image" :src="getRecipeItemInfo(item).image" class="ingredient-img" />
              <span v-else class="ingredient-icon">{{ getRecipeItemInfo(item).icon }}</span>
            </div>
          </div>
        </div>
        
        <!-- 耐心值 -->
        <div class="order-patience">
          <div class="patience-bar">
            <div class="patience-fill" :style="{ width: (customer.patience / customer.maxPatience * 100) + '%' }"></div>
          </div>
        </div>
      </div>
      
      <!-- 无订单提示 -->
      <div v-if="customers.length === 0" class="no-orders">
        🚩 暂无订单
      </div>
    </div>
  </div>
</template>

<style scoped>
.order-list {
  width: 280px;
  background: linear-gradient(180deg, #2a1a15 0%, #1a0f0a 100%);
  border-left: 3px solid var(--light-wood);
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 16px;
  color: var(--gold);
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid var(--light-wood);
}

.orders-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 订单项 */
.order-item {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid var(--light-wood);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s;
  cursor: pointer;
}

.order-item.active {
  border-color: var(--success-green);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.3);
  cursor: default;
}

.order-item.pending {
  opacity: 0.8;
}

.order-item.pending:hover {
  opacity: 1;
  border-color: var(--gold);
}

/* 菜品头部 */
.order-dish-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dish-icon-large {
  width: 48px;
  height: 48px;
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.dish-info {
  flex: 1;
}

.dish-name {
  font-size: 15px;
  color: var(--gold);
  font-weight: bold;
}

.dish-price {
  font-size: 13px;
  color: var(--success-green);
  margin-top: 2px;
}

/* 原料列表 */
.order-ingredients {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 6px 0;
}

.ingredients-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.ingredient-tag {
  font-size: 11px;
  background: rgba(139, 115, 85, 0.3);
  border: 1px solid var(--light-wood);
  border-radius: 4px;
  padding: 2px 6px;
  color: var(--text-light);
}

/* 配方食材项（图片版） */
.ingredient-item {
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--light-wood);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ingredient-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.ingredient-icon {
  font-size: 22px;
}

/* 配方类型边框颜色 */
.ingredient-item.recipe-prepared {
  border-color: var(--success-green);
}

.ingredient-item.recipe-seasoning {
  border-color: var(--warning-orange);
}

.ingredient-item.recipe-raw {
  border-color: #a78bfa;
}

.order-patience {
  margin-top: 4px;
}

.patience-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.patience-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--danger-red), var(--warning-orange), var(--success-green));
  transition: width 0.3s;
}

.no-orders {
  text-align: center;
  color: var(--text-muted);
  padding: 30px;
  font-size: 16px;
}
</style>
