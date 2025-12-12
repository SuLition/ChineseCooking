<script setup>
/**
 * 中华料理传奇 - 主应用
 * Chinese Cuisine Legend - Main App
 *
 * 使用现代化游戏架构
 */
import { ref, computed, provide } from 'vue'
import CustomerList from './components/CustomerList.vue'
import SoundPanel from './components/SoundPanel.vue'
import UpgradePanel from './components/UpgradePanel.vue'
import ShopPanel from './components/ShopPanel.vue'
import SpecialEventModal from './components/SpecialEventModal.vue'
import Toast from './components/ui/Toast.vue'
import Achievement from './components/ui/Achievement.vue'
import ComboDisplay from './components/ui/ComboDisplay.vue'
// 拆分出的组件
import StatusBar from './components/StatusBar.vue'
import DebugModal from './components/DebugModal.vue'
import OrderList from './components/OrderList.vue'
import ApplianceItem from './components/ApplianceItem.vue'
import IngredientItem from './components/IngredientItem.vue'
import PreparedItem from './components/PreparedItem.vue'
import PlatesSection from './components/PlatesSection.vue'
import SeasoningsSection from './components/SeasoningsSection.vue'

// 导入游戏核心
import { useGame, useDragDrop, useCooking, useApplianceGrid } from './game'
import { usePlates } from './game/composables/usePlates'
import { useAutoCook } from './game/composables/useAutoCook'
import { preparedIngredients } from './game/data/ingredients'
import { GRID, PLATE_STATUS } from './game/constants'

// ============================================================
// 系统初始化顺序（严格按依赖关系排序）
// 1. 游戏核心系统 (useGame) - 基础系统，无依赖
// 2. 盘子系统 (usePlates) - 依赖 userData, randomEventsSystem
// 3. 拖拽系统 (useDragDrop) - 依赖 plates, applianceStates
// 4. 烹饪系统 (useCooking) - 依赖 applianceStates
// 5. 自动做菜系统 (useAutoCook) - 依赖 plates, handleStartCooking
// 6. 网格布局系统 (useApplianceGrid) - 依赖 userApplianceLayout
// ============================================================

// ========== 1. 初始化游戏核心系统 ==========
// 包含：Store, TimeSystem, CustomerSystem, SoundSystem, RandomEventsSystem, DebugSystem
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
  userIngredientList,
  ownedApplianceIds,
  stackedPreparedItems,
  
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
  handleBuyIngredient,
  handleBuyAppliance,
  
  // UI 辅助
  showToast,
  
  // 调试功能（包含事件调试）
  debugState,
  toggleCustomerSpawn,
  debugSpawnCustomer,
  debugClearAllCustomers,
  debugRemoveCustomer,
  // 事件调试
  toggleEvents,
  updateProbability,
  updateDifficulty,
  triggerEvent,
  resetCooldowns,
  
  // 随机事件系统
  randomEventsSystem,
  bugEatenIngredientId,
  isPowerOutage,
  activeThiefEvent,
  handleThiefOption
} = useGame()

// ========== 2. 初始化盘子系统 ==========
// 管理盘子状态、清洗、装盘、上菜等功能
const {
  plates,
  initPlates,
  handlePlateWash,
  handlePlateClear,
  addDishToPlate,
  addItemToPlate,
  handleServeDish,
  handlePlateDropOnAppliance
} = usePlates({
  userData,
  randomEventsSystem,
  showToast,
  serveCustomer,
  customers,
  applianceStates
})

// ========== 3. 初始化拖拽系统 ==========
// 管理食材、厨具、盘子的拖拽交互
const { COLS: GRID_COLS, ROWS: GRID_ROWS } = GRID

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
  handleApplianceDrop,
  
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
  handlePlateDropOnAppliance,
  onIngredientDragStart: (ingredient) => randomEventsSystem.checkIngredientDrop(ingredient),
  GRID_COLS,
  GRID_ROWS
})

// ========== 4. 初始化烹饪系统 ==========
// 管理厨具烹饪逻辑
const {
  handleStartCooking,
  handleClearAppliance
} = useCooking({
  applianceStates,
  showToast,
  isShopOpen: () => state.isOpen
})

// ========== 5. 初始化自动做菜系统 ==========
// AI 自动烹饪功能
const {
  enabled: autoCookEnabled,
  toggle: toggleAutoCook
} = useAutoCook({
  customers,
  inventory,
  userData,
  applianceStates,
  preparedItems,
  plates,
  showToast,
  serveCustomer,
  handlePlateWash,
  addDishToPlate,
  handleStartCooking
})

// ========== 6. 初始化网格布局系统 ==========
// 管理厨具网格布局
const {
  occupiedCells,
  emptySlots,
  getApplianceGridStyle
} = useApplianceGrid({ userApplianceLayout })

// ============================================================
// UI 状态
// ============================================================
const showSoundPanel = ref(false)
const showUpgradePanel = ref(false)
const showShopPanel = ref(false)
const showEventModal = ref(false)
const currentEvent = ref(null)
const achievement = ref(null)
const showCombo = computed(() => state.combo >= 2)
const showDebugModal = ref(false)

// ============================================================
// 提供给子组件的方法
// ============================================================
provide('clickAppliance', clickAppliance)
provide('repairAppliance', (applianceId) => randomEventsSystem.repairAppliance(applianceId))
provide('handleSpecialAction', (applianceId) => randomEventsSystem.handleSpecialEventAction(applianceId))
provide('getEventConfig', (applianceId) => randomEventsSystem.getApplianceEventConfig(applianceId))

</script>

<template>
  <!-- 游戏主容器 -->
  <div class="game-container">
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
      @toggle-debug="showDebugModal = !showDebugModal"
    />
    
    <!-- 调试弹窗 -->
    <DebugModal
      :visible="showDebugModal"
      :customer-spawn-enabled="debugState.customerSpawnEnabled"
      :auto-cook-enabled="autoCookEnabled"
      :customer-count="customers.length"
      :customers="customers"
      :events-enabled="randomEventsSystem.eventsEnabled.value"
      :current-day="state.day"
      @close="showDebugModal = false"
      @toggle-spawn="toggleCustomerSpawn"
      @spawn-customer="debugSpawnCustomer"
      @clear-customers="debugClearAllCustomers"
      @remove-customer="debugRemoveCustomer"
      @toggle-auto-cook="toggleAutoCook"
      @toggle-events="toggleEvents"
      @update-probability="updateProbability"
      @update-difficulty="updateDifficulty"
      @trigger-event="triggerEvent"
      @reset-cooldowns="resetCooldowns"
    />
    
    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧主区域 -->
      <div class="left-area">
        <!-- 顾客列表 -->
        <CustomerList
          :customers="customers"
          :selected-customer-index="selectedCustomerIndex"
          :is-open="state.isOpen"
          @select="selectCustomer"
          @serve-dish="handleServeDish"
        />
        
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
                  :bug-eaten="bugEatenIngredientId === ing.id"
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
                      :is-power-outage="isPowerOutage"
                      draggable="true"
                      @dragstart="handleApplianceLayoutDragStart($event, app.id)"
                      @dragend="handleApplianceLayoutDragEnd"
                      @dragover="handleApplianceDragOver"
                      @dragleave="handleApplianceDragLeave"
                      @drop="handleApplianceDrop"
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
      :owned-appliances="ownedApplianceIds"
      @close="showShopPanel = false" 
      @buy="handleBuyIngredient"
      @buy-appliance="handleBuyAppliance"
    />
    
    <!-- 小偷事件弹窗 -->
    <SpecialEventModal 
      :visible="!!activeThiefEvent" 
      :event="activeThiefEvent" 
      @option-click="handleThiefOption" 
    />
    
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
