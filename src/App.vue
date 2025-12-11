<script setup>
/**
 * 中华料理传奇 - 主应用
 * Chinese Cuisine Legend - Main App
 *
 * 使用现代化游戏架构
 */
import { ref, computed, onUnmounted } from 'vue'
import StartScreen from './components/StartScreen.vue'
import CustomerCard from './components/CustomerCard.vue'
import SoundPanel from './components/SoundPanel.vue'
import UpgradePanel from './components/UpgradePanel.vue'
import ShopPanel from './components/ShopPanel.vue'
import SpecialEventModal from './components/SpecialEventModal.vue'
import Toast from './components/ui/Toast.vue'
import Achievement from './components/ui/Achievement.vue'
import ComboDisplay from './components/ui/ComboDisplay.vue'
// 拆分出的组件
import StatusBar from './components/StatusBar.vue'
import DebugMenu from './components/DebugMenu.vue'
import OrderList from './components/OrderList.vue'
import ApplianceItem from './components/ApplianceItem.vue'
import IngredientItem from './components/IngredientItem.vue'
import PreparedItem from './components/PreparedItem.vue'
import PlatesSection from './components/PlatesSection.vue'
import SeasoningsSection from './components/SeasoningsSection.vue'

// 导入游戏核心
import { useGame, useDragDrop, useCooking } from './game'
import { useGameStore } from './game/stores/gameStore'
import { rawIngredients, preparedIngredients, seasonings } from './game/data/ingredients'
import { appliances } from './game/data/appliances'
import { dishes } from './game/data/dishes'

// ========== 初始化游戏 ==========
const {
  // 状态
  state,
  customers,
  selectedCustomerIndex,
  cookingState,
  inventory,
  applianceStates,
  preparedItems,
  toasts,
  
  // 用户数据
  userData,
  
  // 计算属性
  formattedTime,
  timePeriodName,
  goalProgress,
  ingredientList,
  
  // 游戏控制
  startGame,
  openShop,
  closeShop,
  
  // 顾客操作
  selectCustomer,
  serveCustomer,
  
  // 厨具操作
  canProcessIngredient,
  dropIngredientOnAppliance,
  clickAppliance,
  
  // 厨具布局
  userApplianceLayout,
  updateAppliancePosition,
  
  // 库存操作
  buyIngredient,
  
  // UI 辅助
  showToast,
  
  // 调试功能
  debugState,
  toggleCustomerSpawn,
  debugSpawnCustomer,
  debugSpawnDish,
  dishList
} = useGame()

// 只显示用户拥有库存的食材
const userIngredientList = computed(() => {
  return ingredientList.value.filter(ing => (inventory[ing.id] || 0) > 0)
})

// ========== UI 状态 ==========
const showSoundPanel = ref(false)
const showUpgradePanel = ref(false)
const showShopPanel = ref(false)
const showEventModal = ref(false)
const currentEvent = ref(null)
const achievement = ref(null)
const showCombo = computed(() => state.combo >= 2)

// 调试菜单
const showDebugMenu = ref(false)

// 盘子数据结构 - 每个盘子只能装一个成品菜
// status: 'empty' | 'hasDish' | 'served'
const plates = ref([])

// 初始化盘子数组
function initPlates() {
  plates.value = Array.from({ length: userData.plates }, () => ({
    status: 'empty',
    dish: null
  }))
}
initPlates()

// ========== 初始化拖拽系统 ==========
const GRID_COLS = 10
const GRID_ROWS = 5

const {
  // 拖拽状态
  draggingIngredient,
  draggingPrepared,
  draggingSeasoning,
  draggingPlateIndex,
  draggingFromAppliance,
  draggingAppliance,
  dragPreviewPos,
  gridRef,
  
  // 计算属性
  isDragging,
  isDraggingPlate,
  isDraggingItemForPlate,
  dragPreviewStyle,
  currentDraggingAllowedAppliances,
  currentDraggingIngredientType,
  
  // 厨具布局拖拽
  isValidPosition,
  handleApplianceLayoutDragStart,
  handleApplianceLayoutDragEnd,
  handleGridDragOver,
  handleGridDrop,
  
  // 食材拖拽
  handleDragStart,
  handleDragEnd,
  handlePreparedDragStart,
  handlePreparedDragEnd,
  handleSeasoningDragStart,
  handleSeasoningDragEnd,
  
  // 厨具中食材拖抽
  handleApplianceIngredientDragStart,
  handleApplianceIngredientDragEnd,
  
  // 厨具区域拖放
  handleApplianceDragOver,
  handleApplianceDragLeave,
  handleApplianceDrop: _handleApplianceDrop,
  
  // 盘子拖放
  handlePlateDragStart,
  handlePlateDragEnd,
  handlePlateDropItem,
  
  // 备菜区域拖放
  handlePreparedSectionDragOver,
  handlePreparedSectionDragLeave,
  handlePreparedSectionDrop,
  
  // 食材区域拖放
  handleIngredientsSectionDragOver,
  handleIngredientsSectionDragLeave,
  handleIngredientsSectionDrop
} = useDragDrop({
  inventory,
  preparedItems,
  applianceStates,
  userData,
  plates,
  userApplianceLayout,
  showToast,
  addItemToPlate,
  GRID_COLS,
  GRID_ROWS
})

// ========== 初始化烹饪系统 ==========
const {
  handleStartCooking,
  handleClearAppliance
} = useCooking({
  applianceStates,
  showToast,
  isShopOpen: () => state.isOpen
})

// 包装 handleApplianceDrop，传入 handlePlateDropOnAppliance 回调
function handleApplianceDrop(e, applianceId) {
  _handleApplianceDrop(e, applianceId, handlePlateDropOnAppliance)
}

// 盘子拖放到厨具上（装盘）
function handlePlateDropOnAppliance(applianceId) {
  if (draggingPlateIndex.value < 0) return
  
  const plate = plates.value[draggingPlateIndex.value]
  if (!plate || plate.status !== 'empty') {
    showToast('❌ 盘子已有菜品', 'error')
    return
  }
  
  const appliance = applianceStates[applianceId]
  if (!appliance || appliance.status !== 'done') {
    showToast('❌ 厨具还没做好', 'error')
    return
  }
  
  // 获取成品
  const store = useGameStore()
  const dish = store.serveDish(applianceId)
  if (!dish) {
    showToast('❌ 无法装盘', 'error')
    return
  }
  
  // 装盘
  addDishToPlate(draggingPlateIndex.value, dish)
  showToast(`✅ 将 ${dish.name} 装盘`, 'success')
}

// 清空指定盘子
function handlePlateClear(plateIndex) {
  const plate = plates.value[plateIndex]
  if (!plate || plate.status === 'empty') return
  
  // 直接丢弃盘中的菜品
  plates.value[plateIndex] = {
    status: 'empty',
    dish: null
  }
  showToast('🗑️ 已清空盘子', 'success')
}

// ========== 盘子清洗系统 ==========

let plateWashTimer = null

// 启动清洗循环
function startWashingLoop() {
  if (plateWashTimer) return  // 已在运行
  plateWashTimer = setInterval(() => {
    updatePlateWashing()
  }, 100)
}

// 停止清洗循环
function stopWashingLoop() {
  if (plateWashTimer) {
    clearInterval(plateWashTimer)
    plateWashTimer = null
  }
}

// 开始清洗盘子
function handlePlateWash(plateIndex) {
  const plate = plates.value[plateIndex]
  if (!plate || plate.status !== 'dirty') return
  
  // 开始清洗
  plates.value[plateIndex] = {
    status: 'washing',
    dish: null,
    washProgress: 0,
    washStartTime: Date.now(),
    washDuration: 2000  // 2秒清洗时间
  }
  showToast('🧼 开始清洗盘子...', 'success')
  
  // 启动清洗循环
  startWashingLoop()
}

// 更新盘子清洗进度
function updatePlateWashing() {
  let hasWashingPlates = false
  
  plates.value.forEach((plate, index) => {
    if (plate.status === 'washing') {
      hasWashingPlates = true
      const elapsed = Date.now() - plate.washStartTime
      const progress = Math.min(100, (elapsed / plate.washDuration) * 100)
      plate.washProgress = progress
      
      // 清洗完成
      if (progress >= 100) {
        plates.value[index] = {
          status: 'empty',
          dish: null
        }
        showToast('✨ 盘子清洗完成！', 'success')
      }
    }
  })
  
  // 没有盘子在清洗，停止循环
  if (!hasWashingPlates) {
    stopWashingLoop()
  }
}

// 组件卸载时清理
onUnmounted(() => {
  stopWashingLoop()
})

// 上菜给顾客
function handleServeDish(plateIndex, customer) {
  const plate = plates.value[plateIndex]
  if (!plate || plate.status !== 'hasDish' || !plate.dish) {
    showToast('❌ 盘子里没有菜品', 'error')
    return
  }
  
  // 找到顾客的索引
  const customerIndex = customers.value.findIndex(c => c.id === customer.id)
  if (customerIndex < 0) {
    showToast('❌ 顾客已离开', 'error')
    return
  }
  
  // 尝试上菜
  const result = serveCustomer(customerIndex, plate.dish.id)
  if (result) {
    // 上菜成功，盘子变为待清洗状态
    plates.value[plateIndex] = {
      status: 'dirty',
      dish: null
    }
  }
}

// 向盘子添加成品菜
function addDishToPlate(plateIndex, dish) {
  const plate = plates.value[plateIndex]
  if (!plate || plate.status !== 'empty') return false
  
  plate.status = 'hasDish'
  plate.dish = {
    id: dish.id,
    name: dish.name,
    icon: dish.icon,
    image: dish.image
  }
  
  return true
}

// 向盘子添加食材（兑容旧接口，现在只接受成品菜）
function addItemToPlate(plateIndex, item) {
  return addDishToPlate(plateIndex, item)
}

// ========== 厨具网格布局计算 ==========

// 计算被占用的格子位置
const occupiedCells = computed(() => {
  const occupied = new Set()
  userApplianceLayout.value.forEach(app => {
    for (let r = app.row; r < app.row + app.height; r++) {
      for (let c = app.col; c < app.col + app.width; c++) {
        occupied.add(`${r}-${c}`)
      }
    }
  })
  return occupied
})

// 生成空的格子列表
const emptySlots = computed(() => {
  const slots = []
  for (let row = 1; row <= GRID_ROWS; row++) {
    for (let col = 1; col <= GRID_COLS; col++) {
      if (!occupiedCells.value.has(`${row}-${col}`)) {
        slots.push({ row, col, key: `slot-${row}-${col}` })
      }
    }
  }
  return slots
})

// 获取厨具的grid-area样式
function getApplianceGridStyle(app) {
  return {
    gridArea: `${app.row} / ${app.col} / ${app.row + app.height} / ${app.col + app.width}`
  }
}

// 备菜堆叠计算属性 - 将相同备菜合并并计算数量
const stackedPreparedItems = computed(() => {
  const stacks = {}
  preparedItems.value.forEach(item => {
    if (stacks[item.id]) {
      stacks[item.id].count++
    } else {
      stacks[item.id] = {
        id: item.id,
        count: 1
      }
    }
  })
  return Object.values(stacks)
})

// ========== 方法 ==========
function handleStartGame() {
  startGame()
}

function handleEventOption(index) {
  showEventModal.value = false
  currentEvent.value = null
}

// 购买食材
function handleBuyIngredient(ingredientId, count, price) {
  if (buyIngredient(ingredientId, count, price)) {
    const info = rawIngredients[ingredientId]
    showToast(`购买了 ${count} 个 ${info?.name || ingredientId}`, 'money')
  } else {
    showToast('金币不足！', 'error')
  }
}

// ========== 调试功能 ==========

// 切换顾客生成
function handleToggleCustomerSpawn() {
  const enabled = toggleCustomerSpawn()
  showToast(`[调试] 顾客生成: ${enabled ? '开启' : '关闭'}`, enabled ? 'success' : 'error')
}

// 手动生成顾客
function handleDebugSpawnCustomer() {
  debugSpawnCustomer()
}

// 生成指定菜品
function handleDebugSpawnDish(dishId) {
  if (!dishId) {
    showToast('[调试] 请先选择菜品', 'error')
    return
  }
  debugSpawnDish(dishId)
}

// 点击厨具
function handleApplianceClick(applianceId) {
  clickAppliance(applianceId)
}

</script>

<template>
  <!-- 开始界面 -->
  <StartScreen v-if="!state.isStarted" @start="handleStartGame" />
  
  <!-- 游戏主容器 -->
  <div v-else class="game-container">
    <!-- 顶部状态栏 -->
    <StatusBar
      :money="state.money"
      :reputation="state.reputation"
      :level="state.level"
      :time-period-name="timePeriodName"
      :formatted-time="formattedTime"
      :daily-served="state.dailyServed"
      :daily-goal="state.dailyGoal"
      :daily-money-goal="state.dailyMoneyGoal"
      :goal-progress="goalProgress"
      :is-open="state.isOpen"
      @open-shop="openShop"
      @close-shop="closeShop"
      @show-shop-panel="showShopPanel = true"
      @show-upgrade-panel="showUpgradePanel = true"
      @show-sound-panel="showSoundPanel = !showSoundPanel"
      @toggle-debug="showDebugMenu = !showDebugMenu"
    />
    
    <!-- 调试菜单 -->
    <DebugMenu
      :visible="showDebugMenu"
      :customer-spawn-enabled="debugState.customerSpawnEnabled"
      :customer-count="customers.length"
      :dish-list="dishList"
      @toggle-spawn="handleToggleCustomerSpawn"
      @spawn-customer="handleDebugSpawnCustomer"
      @spawn-dish="debugSpawnDish"
    />
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧主区域 -->
      <div class="left-area">
        <!-- 顾客列表 -->
        <div class="customer-list">
          <div class="customer-scroll">
            <!-- 未开店提示 -->
            <div v-if="!state.isOpen" class="empty-hint">
              🏮 点击“开店”开始营业
            </div>
            <!-- 无顾客提示 -->
            <div v-else-if="customers.length === 0" class="empty-hint">
              ⏳ 等待顾客中...
            </div>
            <!-- 顾客卡片 -->
            <CustomerCard
              v-for="(customer, index) in customers"
              :key="customer.id"
              :customer="customer"
              :selected="selectedCustomerIndex === index"
              @select="selectCustomer(index)"
              @serve-dish="handleServeDish"
            />
          </div>
        </div>
        
        <!-- 主工作区（新版做菜系统） -->
        <div class="kitchen-area">
          <!-- 顶部区域：盘子 + 调料 -->
          <div class="top-row">
            <PlatesSection 
              :plates="plates"
              :plate-count="userData.plates"
              :is-dragging-item="!!isDraggingItemForPlate"
              @drag-start="handlePlateDragStart"
              @drag-end="handlePlateDragEnd"
              @clear="handlePlateClear"
              @wash="handlePlateWash"
              @drop-item="handlePlateDropItem"
            />
            <SeasoningsSection 
              :seasoning-stock="userData.seasonings"
              @dragstart="handleSeasoningDragStart"
              @dragend="handleSeasoningDragEnd"
            />
          </div>
          
          <!-- 中间区域：食材 + (备菜 + 厨具) -->
          <div class="middle-row">
            <!-- 左侧：食材列表 -->
            <div 
              class="ingredients-section"
              @dragover="handleIngredientsSectionDragOver"
              @dragleave="handleIngredientsSectionDragLeave"
              @drop="handleIngredientsSectionDrop"
            >
              <div class="section-header">食材列表</div>
              <div class="section-hint">拖拽放到不同的厨具上</div>
              <div class="ingredients-grid">
                <IngredientItem
                  v-for="ing in userIngredientList" 
                  :key="ing.id"
                  :ingredient="ing"
                  :stock="inventory[ing.id] || 0"
                  @dragstart="handleDragStart($event, ing.id)"
                  @dragend="handleDragEnd"
                />
              </div>
            </div>
            
            <!-- 右侧：备菜 + 厨具 -->
            <div class="right-area">
              <!-- 备菜列表 -->
              <div 
                class="prepared-section"
                @dragover="handlePreparedSectionDragOver"
                @dragleave="handlePreparedSectionDragLeave"
                @drop="handlePreparedSectionDrop"
              >
                <div class="section-header">备菜列表 <span class="prepared-count">{{ preparedItems.length }}</span></div>
                <div class="section-hint">拖拽到厨具中继续烹饪</div>
                <div class="prepared-grid">
                  <PreparedItem
                    v-for="item in stackedPreparedItems" 
                    :key="item.id"
                    :prepared-id="item.id"
                    :prepared="preparedIngredients[item.id]"
                    :count="item.count"
                    @dragstart="handlePreparedDragStart"
                    @dragend="handlePreparedDragEnd"
                  />
                  <div v-if="preparedItems.length === 0" class="prepared-empty">
                    暂无备菜
                  </div>
                </div>
              </div>
              
              <!-- 厨具区域 -->
              <div class="appliances-section">
                <div class="appliances-scroll">
                  <div 
                    ref="gridRef"
                    class="appliances-grid"
                    @dragover="handleGridDragOver"
                    @drop="handleGridDrop"
                  >
                    <!-- 动态生成空位格子 -->
                    <div 
                      v-for="slot in emptySlots" 
                      :key="slot.key" 
                      class="grid-slot"
                      :style="{ gridArea: `${slot.row} / ${slot.col} / ${slot.row + 1} / ${slot.col + 1}` }"
                    ></div>
                    
                    <!-- 拖拽预览占位 -->
                    <div 
                      v-if="dragPreviewStyle"
                      class="drag-preview"
                      :class="{ 'preview-valid': dragPreviewStyle.isValid, 'preview-invalid': !dragPreviewStyle.isValid }"
                      :style="{ gridArea: dragPreviewStyle.gridArea }"
                    ></div>
                    
                    <!-- 动态生成厨具 -->
                    <ApplianceItem
                      v-for="app in userApplianceLayout"
                      :key="app.id"
                      class="grid-appliance"
                      :class="{ 'is-dragging': draggingAppliance === app.id }"
                      :style="getApplianceGridStyle(app)"
                      :appliance-id="app.id"
                      :appliance-state="applianceStates[app.id]"
                      :size-class="`size-${app.width}x${app.height}`"
                      :dragging-ingredient="draggingIngredient || draggingPrepared || draggingSeasoning || (draggingFromAppliance && draggingFromAppliance.content?.id)"
                      :dragging-ingredient-type="currentDraggingIngredientType"
                      :dragging-plate="isDraggingPlate"
                      :allowed-appliances="currentDraggingAllowedAppliances"
                      :can-process="true"
                      draggable="true"
                      @dragstart="handleApplianceLayoutDragStart($event, app.id)"
                      @dragend="handleApplianceLayoutDragEnd"
                      @dragover="handleApplianceDragOver"
                      @dragleave="handleApplianceDragLeave"
                      @drop="handleApplianceDrop"
                      @click="handleApplianceClick"
                      @start-cooking="handleStartCooking"
                      @clear="handleClearAppliance"
                      @ingredient-drag-start="handleApplianceIngredientDragStart"
                      @ingredient-drag-end="handleApplianceIngredientDragEnd"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧订单列表 -->
      <OrderList
        :customers="customers"
        :selected-customer-index="selectedCustomerIndex"
        :current-customer="cookingState.currentCustomer"
        @select-customer="selectCustomer"
      />
    </div>
    
    <!-- 音效设置面板 -->
    <SoundPanel :visible="showSoundPanel" @close="showSoundPanel = false" />
    
    <!-- 升级面板 -->
    <UpgradePanel :visible="showUpgradePanel" :money="state.money" :upgrades="state.upgrades" :level="state.level" @close="showUpgradePanel = false" />
    
    <!-- 进货商店面板 -->
    <ShopPanel 
      :visible="showShopPanel" 
      :money="state.money" 
      :inventory="inventory" 
      @close="showShopPanel = false" 
      @buy="handleBuyIngredient" 
    />
    
    <!-- 特殊事件弹窗 -->
    <SpecialEventModal :visible="showEventModal" :event="currentEvent" @option-click="handleEventOption" />
    
    <!-- 连击显示 -->
    <ComboDisplay :combo="state.combo" :visible="showCombo" />
    
    <!-- Toast 提示 -->
    <Toast v-for="toast in toasts" :key="toast.id" :message="toast.message" :type="toast.type" />
    
    <!-- 成就提示 -->
    <Achievement v-if="achievement" :icon="achievement.icon" :title="achievement.title" :desc="achievement.desc" />
  </div>
</template>

<style scoped>
/* 主内容区 */
.main-content {
  display: flex;
  height: calc(100vh - 60px);
}

/* 左侧主区域 */
.left-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* 顾客列表 */
.customer-list {
  height: 160px;
  background: linear-gradient(180deg, #1a0f0a 0%, #2d1f1a 100%);
  border-bottom: 3px solid var(--light-wood);
}

.customer-scroll {
  display: flex;
  gap: 15px;
  padding: 10px 15px;
  overflow-x: auto;
  height: 100%;
  align-items: center;
}

.empty-hint {
  width: 100%;
  text-align: center;
  color: var(--text-muted);
  font-size: 16px;
  padding: 20px;
}

/* 工作区 - 新版做菜系统 */
.kitchen-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: radial-gradient(ellipse at center, rgba(60, 40, 30, 0.8) 0%, #1a0f0a 100%);
  min-height: 0;
  padding: 15px;
  gap: 12px;
}

/* 顶部区域：盘子 + 调料 */
.top-row {
  display: flex;
  gap: 15px;
  height: 130px;
}

/* 中间区域 */
.middle-row {
  flex: 1;
  display: flex;
  gap: 15px;
  min-height: 0;
}

/* 通用区域标题 */
.section-header {
  font-size: 14px;
  color: var(--gold);
  font-weight: bold;
  margin-bottom: 6px;
}

.section-hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 10px;
}

/* 食材列表 - 固定宽度 */
.ingredients-section {
  padding: 12px;
  width: 360px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s;
}

.ingredients-section.drag-over {
  border-color: var(--success-green);
  background: rgba(74, 222, 128, 0.15);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.4);
}

.ingredients-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  overflow-y: auto;
  overflow-x: visible;
  align-content: start;
}

/* 右侧区域：备菜 + 厨具 */
.right-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* 备菜区域 - 只显示一行 */
.prepared-section {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 12px;
  padding: 10px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.prepared-section.drag-over {
  border-color: var(--success-green);
  background: rgba(74, 222, 128, 0.15);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.4);
}

.prepared-grid {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  height: 90px;
  align-items: center;
}

.prepared-count {
  font-size: 12px;
  color: var(--success-green);
  background: rgba(74, 222, 128, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

.prepared-empty {
  color: var(--text-muted);
  font-size: 12px;
  width: 100%;
  text-align: center;
}

/* 厨具区域 */
.appliances-section {
  flex: 1;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.appliances-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* 滚动条样式 */
.appliances-scroll::-webkit-scrollbar {
  width: 6px;
}

.appliances-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.appliances-scroll::-webkit-scrollbar-thumb {
  background: var(--light-wood);
  border-radius: 3px;
}

.appliances-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--gold);
}

.appliances-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-auto-rows: 80px;
  gap: 6px;
  min-height: min-content;
}

.grid-slot {
  background: rgba(0, 0, 0, 0.3);
  border: 1px dashed rgba(255, 255, 255, 0.15);
  border-radius: 6px;
}

.grid-appliance {
  z-index: 1;
  cursor: grab;
}

.grid-appliance:active {
  cursor: grabbing;
}

.grid-appliance.is-dragging {
  opacity: 0.3;
}

/* 拖拽预览 */
.drag-preview {
  z-index: 2;
  border-radius: 8px;
  pointer-events: none;
}

.drag-preview.preview-valid {
  background: rgba(74, 222, 128, 0.3);
  border: 2px dashed #4ade80;
}

.drag-preview.preview-invalid {
  background: rgba(239, 68, 68, 0.3);
  border: 2px dashed #ef4444;
}

.appliances-note {
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
