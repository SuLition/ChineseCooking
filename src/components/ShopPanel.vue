<script setup>
/**
 * 进货商店面板
 * ShopPanel Component
 */
import { computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  money: {
    type: Number,
    default: 0
  },
  inventory: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'buy'])

// 食材商品数据（分类）
const shopCategories = [
  {
    name: '蔬菜类',
    icon: '🥬',
    items: [
      { id: 'vegetables', name: '青菜', icon: '🥬', price: 3 },
      { id: 'cabbage', name: '白菜', icon: '🥗', price: 3 },
      { id: 'tomato', name: '番茄', icon: '🍅', price: 4 },
      { id: 'mushroom', name: '香菇', icon: '🍄', price: 5 },
      { id: 'bamboo', name: '竹笋', icon: '🎋', price: 6 },
      { id: 'eggplant', name: '茄子', icon: '🍆', price: 4 }
    ]
  },
  {
    name: '肉类',
    icon: '🥩',
    items: [
      { id: 'pork', name: '猪肉', icon: '🥩', price: 8 },
      { id: 'chicken', name: '鸡肉', icon: '🍗', price: 10 },
      { id: 'beef', name: '牛肉', icon: '🥓', price: 15 },
      { id: 'duck', name: '鸭肉', icon: '🦆', price: 18 }
    ]
  },
  {
    name: '海鲜类',
    icon: '🦐',
    items: [
      { id: 'fish', name: '鱼', icon: '🐟', price: 12 },
      { id: 'shrimp', name: '虾', icon: '🦐', price: 15 },
      { id: 'crab', name: '螃蟹', icon: '🦀', price: 25 }
    ]
  },
  {
    name: '主食类',
    icon: '🍚',
    items: [
      { id: 'rice', name: '米饭', icon: '🍚', price: 2 },
      { id: 'noodles', name: '面条', icon: '🍜', price: 3 },
      { id: 'flour', name: '面粉', icon: '🌾', price: 2 }
    ]
  },
  {
    name: '蛋豆类',
    icon: '🥚',
    items: [
      { id: 'egg', name: '鸡蛋', icon: '🥚', price: 2 },
      { id: 'tofu', name: '豆腐', icon: '🧈', price: 3 }
    ]
  },
  {
    name: '调料类',
    icon: '🧂',
    items: [
      { id: 'chili', name: '辣椒', icon: '🌶️', price: 2 },
      { id: 'ginger', name: '姜', icon: '🫚', price: 2 },
      { id: 'garlic', name: '大蒜', icon: '🧄', price: 2 },
      { id: 'spring_onion', name: '葱', icon: '🧅', price: 1 },
      { id: 'soy_sauce', name: '酱油', icon: '🫗', price: 3 },
      { id: 'vinegar', name: '醋', icon: '🍶', price: 3 },
      { id: 'sugar', name: '糖', icon: '🧂', price: 2 },
      { id: 'peanut', name: '花生', icon: '🥜', price: 4 }
    ]
  }
]

// 购买数量选项
const buyOptions = [1, 5, 10]

function getStock(itemId) {
  return props.inventory[itemId] || 0
}

function canAfford(price, count) {
  return props.money >= price * count
}

function handleBuy(item, count) {
  if (canAfford(item.price, count)) {
    emit('buy', item.id, count, item.price)
  }
}
</script>

<template>
  <div class="shop-overlay" :class="{ active: visible }" @click.self="$emit('close')">
    <div class="shop-panel">
      <div class="shop-header">
        <span class="shop-title">🏪 进货商店</span>
        <span class="shop-money">💰 {{ money }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <div class="shop-content">
        <div 
          v-for="category in shopCategories" 
          :key="category.name"
          class="shop-category"
        >
          <div class="category-header">
            {{ category.icon }} {{ category.name }}
          </div>
          <div class="category-items">
            <div 
              v-for="item in category.items" 
              :key="item.id"
              class="shop-item"
            >
              <div class="item-icon">{{ item.icon }}</div>
              <div class="item-info">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-price">💰 {{ item.price }}/个</div>
                <div class="item-stock">库存: {{ getStock(item.id) }}</div>
              </div>
              <div class="item-actions">
                <button 
                  v-for="count in buyOptions"
                  :key="count"
                  class="buy-btn"
                  :class="{ disabled: !canAfford(item.price, count) }"
                  :disabled="!canAfford(item.price, count)"
                  @click="handleBuy(item, count)"
                >
                  +{{ count }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: var(--z-modal);
  display: none;
  align-items: center;
  justify-content: center;
}

.shop-overlay.active {
  display: flex;
}

.shop-panel {
  width: 700px;
  max-height: 80vh;
  background: linear-gradient(180deg, #3d2a1f 0%, #2d1f1a 100%);
  border: 4px solid var(--gold);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.shop-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 3px solid var(--light-wood);
}

.shop-title {
  font-size: 22px;
  color: var(--gold);
  flex: 1;
}

.shop-money {
  font-size: 18px;
  color: var(--success-green);
  margin-right: 20px;
  padding: 5px 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
}

.close-btn {
  width: 32px;
  height: 32px;
  background: var(--primary-red);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--primary-red-dark);
  transform: scale(1.1);
}

.shop-content {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.shop-category {
  margin-bottom: 20px;
}

.category-header {
  font-size: 16px;
  color: var(--gold);
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  margin-bottom: 10px;
}

.category-items {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 10px;
  transition: all 0.2s;
}

.shop-item:hover {
  border-color: var(--gold);
}

.item-icon {
  font-size: 32px;
  width: 45px;
  text-align: center;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  color: var(--text-light);
  font-weight: bold;
}

.item-price {
  font-size: 12px;
  color: var(--success-green);
}

.item-stock {
  font-size: 11px;
  color: var(--text-muted);
}

.item-actions {
  display: flex;
  gap: 5px;
}

.buy-btn {
  padding: 5px 10px;
  background: linear-gradient(180deg, var(--success-green) 0%, var(--success-green-dark) 100%);
  border: 2px solid #fff;
  border-radius: 6px;
  color: #000;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-btn:hover:not(.disabled) {
  transform: scale(1.1);
}

.buy-btn.disabled {
  background: #666;
  border-color: #888;
  color: #aaa;
  cursor: not-allowed;
}
</style>
