<script setup>
/**
 * 进货商店面板
 * ShopPanel Component
 */
import { ref, computed } from 'vue'
import { ingredientCategories, buyQuantityOptions } from '../game/data/shopItems'
import { getPurchasableAppliances } from '../game/data/appliances'

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
  },
  ownedAppliances: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'buy', 'buy-appliance'])

// 主分类标签页
const activeTab = ref('ingredients') // 'ingredients' | 'equipment'

// 使用数据模块
const shopCategories = ingredientCategories
const buyOptions = buyQuantityOptions

// 可购买设备列表
const purchasableEquipment = computed(() => getPurchasableAppliances())

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

// 检查设备是否已拥有
function isOwned(applianceId) {
  return props.ownedAppliances.includes(applianceId)
}

// 购买设备
function handleBuyAppliance(appliance) {
  if (!isOwned(appliance.id) && canAfford(appliance.price, 1)) {
    emit('buy-appliance', appliance.id, appliance.price)
  }
}
</script>

<template>
  <div class="shop-overlay" :class="{ active: visible }" @click.self="$emit('close')">
    <div class="shop-panel">
      <div class="shop-header">
        <span class="shop-title">🏪 商店</span>
        <span class="shop-money">💰 {{ money }}</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>
      
      <!-- 主分类标签页 -->
      <div class="shop-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'ingredients' }"
          @click="activeTab = 'ingredients'"
        >
          🥬 食材
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'equipment' }"
          @click="activeTab = 'equipment'"
        >
          🛠️ 设备
        </button>
      </div>
      
      <div class="shop-content">
        <!-- 食材分类 -->
        <template v-if="activeTab === 'ingredients'">
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
        </template>
        
        <!-- 设备分类 -->
        <template v-else-if="activeTab === 'equipment'">
          <div class="equipment-list">
            <div 
              v-for="appliance in purchasableEquipment" 
              :key="appliance.id"
              class="equipment-item"
              :class="{ owned: isOwned(appliance.id) }"
            >
              <div class="equipment-icon">
                <img v-if="appliance.image" :src="appliance.image" class="equipment-img" />
                <span v-else>{{ appliance.icon }}</span>
              </div>
              <div class="equipment-info">
                <div class="equipment-name">{{ appliance.name }}</div>
                <div class="equipment-desc">{{ appliance.description }}</div>
                <div class="equipment-stats">
                  <span>容量: {{ appliance.capacity }}</span>
                  <span v-if="appliance.requiresPower">⚡ 需要电力</span>
                </div>
              </div>
              <div class="equipment-buy">
                <div class="equipment-price">💰 {{ appliance.price }}</div>
                <button 
                  v-if="isOwned(appliance.id)"
                  class="buy-btn owned"
                  disabled
                >
                  已拥有
                </button>
                <button 
                  v-else
                  class="buy-btn"
                  :class="{ disabled: !canAfford(appliance.price, 1) }"
                  :disabled="!canAfford(appliance.price, 1)"
                  @click="handleBuyAppliance(appliance)"
                >
                  购买
                </button>
              </div>
            </div>
          </div>
          
          <!-- 无可购买设备提示 -->
          <div v-if="purchasableEquipment.length === 0" class="no-equipment">
            🛠️ 暂无可购买的设备
          </div>
        </template>
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

/* 标签页 */
.shop-tabs {
  display: flex;
  padding: 10px 15px;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 2px solid var(--light-wood);
}

.tab-btn {
  flex: 1;
  padding: 10px 20px;
  font-size: 16px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: var(--gold);
  color: var(--text-light);
}

.tab-btn.active {
  background: linear-gradient(180deg, var(--gold) 0%, #c9a227 100%);
  border-color: var(--gold);
  color: #1a0f0a;
  font-weight: bold;
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

/* 设备列表 */
.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 12px;
  transition: all 0.2s;
}

.equipment-item:hover {
  border-color: var(--gold);
}

.equipment-item.owned {
  opacity: 0.6;
  border-color: var(--success-green);
}

.equipment-icon {
  width: 64px;
  height: 64px;
  font-size: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 10px;
}

.equipment-img {
  width: 54px;
  height: 54px;
  object-fit: contain;
}

.equipment-info {
  flex: 1;
}

.equipment-name {
  font-size: 16px;
  color: var(--gold);
  font-weight: bold;
  margin-bottom: 4px;
}

.equipment-desc {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 6px;
}

.equipment-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--text-muted);
}

.equipment-stats span {
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
}

.equipment-buy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.equipment-price {
  font-size: 16px;
  color: var(--success-green);
  font-weight: bold;
}

.buy-btn.owned {
  background: var(--success-green);
  border-color: var(--success-green);
  color: #fff;
}

.no-equipment {
  text-align: center;
  color: var(--text-muted);
  padding: 40px;
  font-size: 16px;
}
</style>
