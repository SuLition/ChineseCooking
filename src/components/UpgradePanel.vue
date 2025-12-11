<script setup>
/**
 * 升级面板组件
 * UpgradePanel Component
 */

defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  money: {
    type: Number,
    default: 0
  },
  upgrades: {
    type: Object,
    default: () => ({ speed: 0, tips: 0, stations: 1 })
  },
  level: {
    type: Number,
    default: 1
  },
  cuisines: {
    type: Object,
    default: () => ({})
  }
})

defineEmits(['close', 'buy'])

// 升级数据
const upgradeData = {
  speed: {
    name: '烹饪速度',
    icon: '⚡',
    desc: '提升烹饪速度 20%/级',
    maxLevel: 5,
    costs: [100, 200, 400, 800, 1600]
  },
  tips: {
    name: '服务态度',
    icon: '💝',
    desc: '提升小费 15%/级',
    maxLevel: 5,
    costs: [150, 300, 600, 1200, 2400]
  },
  stations: {
    name: '烹饪台',
    icon: '🍳',
    desc: '增加烹饪台数量',
    maxLevel: 4,
    costs: [300, 600, 1200, 2400]
  }
}

function isMaxed(id, currentLevel) {
  return currentLevel >= upgradeData[id].maxLevel
}

function getCost(id, currentLevel) {
  if (isMaxed(id, currentLevel)) return '-'
  return upgradeData[id].costs[currentLevel]
}

function canAfford(id, currentLevel, money) {
  if (isMaxed(id, currentLevel)) return false
  return money >= upgradeData[id].costs[currentLevel]
}
</script>

<template>
  <Teleport to="body">
    <!-- 遮罩层 -->
    <div class="overlay" :class="{ active: visible }" @click="$emit('close')"></div>
    
    <!-- 升级面板 -->
    <div class="upgrade-panel" :class="{ active: visible }">
      <button class="close-btn" @click="$emit('close')">✕</button>
      <div class="upgrade-title">🔧 升级厨房</div>
      
      <div class="upgrade-content">
        <!-- 基础升级 -->
        <div class="upgrade-category">
          <div class="upgrade-category-title">基础升级</div>
          
          <div 
            v-for="(upgrade, id) in upgradeData" 
            :key="id"
            class="upgrade-item"
          >
            <div class="upgrade-icon">{{ upgrade.icon }}</div>
            <div class="upgrade-info">
              <div class="upgrade-name">{{ upgrade.name }}</div>
              <div class="upgrade-desc">{{ upgrade.desc }}</div>
              <div class="upgrade-level">等级: {{ upgrades[id] || 0 }}/{{ upgrade.maxLevel }}</div>
            </div>
            <button 
              class="upgrade-btn"
              :disabled="!canAfford(id, upgrades[id] || 0, money)"
              @click="$emit('buy', id)"
            >
              {{ isMaxed(id, upgrades[id] || 0) ? '已满级' : '💰 ' + getCost(id, upgrades[id] || 0) }}
            </button>
          </div>
        </div>
        
        <!-- 菜系解锁信息 -->
        <div class="upgrade-category">
          <div class="upgrade-category-title">📜 菜系解锁进度</div>
          <div 
            v-for="(cuisine, id) in cuisines" 
            :key="id"
            class="cuisine-info"
            :class="{ unlocked: level >= cuisine.unlockLevel }"
          >
            {{ cuisine.icon }} {{ cuisine.name }} - 
            {{ level >= cuisine.unlockLevel ? '✓ 已解锁' : `Lv.${cuisine.unlockLevel} 解锁` }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: var(--z-overlay);
  display: none;
}

.overlay.active {
  display: block;
}

.upgrade-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(180deg, #3a2a1f 0%, #1a0f0a 100%);
  border: 6px solid var(--gold);
  border-radius: 16px;
  padding: 30px;
  z-index: var(--z-upgrade-panel);
  display: none;
  min-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.upgrade-panel.active {
  display: block;
  animation: popup 0.3s ease-out;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: var(--primary-red);
  border: 2px solid var(--gold);
  color: var(--text-light);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upgrade-title {
  font-size: 28px;
  color: var(--gold);
  text-align: center;
  margin-bottom: 20px;
}

.upgrade-category {
  margin-bottom: 20px;
}

.upgrade-category-title {
  font-size: 18px;
  color: var(--warning-orange);
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 2px solid var(--light-wood);
}

.upgrade-item {
  background: rgba(0, 0, 0, 0.4);
  border: 3px solid var(--light-wood);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.upgrade-icon {
  font-size: 36px;
}

.upgrade-info {
  flex: 1;
}

.upgrade-name {
  font-size: 16px;
  color: var(--text-light);
}

.upgrade-desc {
  font-size: 11px;
  color: #888;
}

.upgrade-level {
  font-size: 11px;
  color: var(--success-green);
}

.upgrade-btn {
  background: linear-gradient(180deg, var(--gold) 0%, #b8860b 100%);
  border: none;
  color: #000;
  font-family: var(--font-chinese);
  font-size: 13px;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.upgrade-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.upgrade-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cuisine-info {
  color: #666;
  font-size: 14px;
  margin: 5px 0;
  padding: 5px;
}

.cuisine-info.unlocked {
  color: var(--success-green);
}
</style>
