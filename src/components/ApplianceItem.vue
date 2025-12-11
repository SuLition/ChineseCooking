<script setup>
/**
 * 单个厨具组件
 */
import { computed, ref } from 'vue'
import { appliances } from '../game/data/appliances'
import { preparedIngredients } from '../game/data/ingredients'

const props = defineProps({
  applianceId: { type: String, required: true },
  applianceState: { type: Object, required: true },
  sizeClass: { type: String, default: 'size-2x2' },
  locked: { type: Boolean, default: false },
  unlockLevel: { type: Number, default: 1 },
  draggingIngredient: { type: String, default: null },
  draggingIngredientType: { type: String, default: null },
  draggingPlate: { type: Boolean, default: false },
  allowedAppliances: { type: Array, default: () => [] },
  canProcess: { type: Boolean, default: false },
  eventConfig: { type: Object, default: null }  // 专属事件配置
})

const emit = defineEmits(['dragover', 'dragleave', 'drop', 'start-cooking', 'clear', 'click', 'ingredient-drag-start', 'ingredient-drag-end', 'repair', 'special-action'])

// 获取厨具数据
const applianceData = computed(() => appliances[props.applianceId])

// 是否是垃圾桶
const isTrashBin = computed(() => applianceData.value?.type === 'trash')

// 获取厨具尺寸
const gridCols = computed(() => applianceData.value?.gridSize?.cols || 2)
const gridRows = computed(() => applianceData.value?.gridSize?.rows || 2)

// 容量（使用厨具数据中的 capacity 字段）
const capacity = computed(() => applianceData.value?.capacity || 1)

// 内容行数（根据容量和列数计算）
const contentRows = computed(() => Math.ceil(capacity.value / gridCols.value))

// 是否会烧糊
const canBurn = computed(() => (applianceData.value?.burnTime || 0) > 0)

// 是否显示操作按钮
const showActions = ref(false)

// 获取操作按钮文字
const actionButtonText = computed(() => {
  const actionMap = {
    cutting_board: '🔪 切菜',
    wok: '🔥 翻炒',
    steamer: '♨️ 蒸制',
    mixer: '🥤 搅拌',
    grill: '🔥 烘烤',
    trash_bin: '🗑️ 清理'
  }
  return actionMap[props.applianceId] || '✅ 开始'
})

// 烧焦提示文字
const burnedText = computed(() => {
  const textMap = {
    wok: '🔥 炒糊了！',
    steamer: '💨 蒸过头了！',
    mixer: '❌ 搅坏了！',
    grill: '🔥 烤焦了！',
    cutting_board: '❌ 切坏了！'
  }
  return textMap[props.applianceId] || '🔥 烧焦了！'
})

// 获取拖抽时厨具的class
function getDragTargetClass() {
  // 如果正在拖拽盘子
  if (props.draggingPlate) {
    if (props.applianceState.status === 'done') return 'drag-can-drop'
    return 'drag-unavailable'
  }
  // 如果正在拖拽食材/备菜/调料
  if (!props.draggingIngredient) return ''
  
  const status = props.applianceState.status
  
  // 垃圾桶特殊处理：接受所有类型的物品
  if (isTrashBin.value) {
    // 只有空闲或有垃圾状态才能添加
    if (status !== 'idle' && status !== 'hasIngredients') return 'drag-unavailable'
    // 检查容量
    const currentCount = props.applianceState.trashCount || 0
    const capacity = applianceData.value?.capacity || 20
    if (currentCount >= capacity) return 'drag-cannot-drop'
    return 'drag-can-drop'
  }
  
  // 厨具必须是空闲、有食材或完成状态
  if (status !== 'idle' && status !== 'hasIngredients' && status !== 'done') return 'drag-unavailable'
  
  // 检查是否允许放入该厨具
  const allowed = props.allowedAppliances
  // 空数组表示允许所有厨具
  if (allowed.length === 0) return 'drag-can-drop'
  // 检查当前厨具是否在允许列表中
  if (allowed.includes(props.applianceId)) return 'drag-can-drop'
  return 'drag-cannot-drop'
}

// 获取厨具显示的名称
function getDisplayName() {
  const appliance = props.applianceState
  const data = applianceData.value
  
  // 垃圾桶特殊显示
  if (isTrashBin.value) {
    if (appliance.status === 'cleaning') return '🗑️ 清理中...'
    const count = appliance.trashCount || 0
    const capacity = data?.capacity || 20
    return `垃圾桶: ${Math.round((count / capacity) * 100)}%`
  }
  
  if (appliance.status === 'burned') return burnedText.value
  if (appliance.status === 'cleaning') return '🧹 清理中...'
  if (appliance.status === 'broken') return '🔧 损坏了!'
  if (appliance.status === 'repairing') return '🔧 修理中...'
  // 专属事件状态
  if (props.eventConfig) return props.eventConfig.icon + ' ' + props.eventConfig.name
  if (appliance.status === 'processing') return '处理中...'
  if (appliance.status === 'done') {
    // 显示成品菜名称
    return appliance.outputDish?.name || '❓ 未知菜品'
  }
  if (appliance.status === 'hasIngredients') {
    return data?.name || props.applianceId
  }
  return data?.name || props.applianceId
}

function handleDragOver(e) {
  if (!props.locked) {
    emit('dragover', e, props.applianceId)
  }
}

function handleDrop(e) {
  if (!props.locked) {
    emit('drop', e, props.applianceId)
  }
}

function handleClick() {
  if (!props.locked) {
    emit('click', props.applianceId)
  }
}

function handleStartCooking() {
  emit('start-cooking', props.applianceId)
}

// 获取槽位内容（根据状态返回不同内容）
function getSlotContent(index) {
  if (props.applianceState.status === 'done') {
    // 完成状态：第一个槽显示成品，其他为空
    if (index === 0 && props.applianceState.outputDish) {
      return props.applianceState.outputDish
    }
    return null
  }
  // 其他状态：显示食材
  return props.applianceState.ingredients[index]
}

// 判断槽位是否可拖拽
function isSlotDraggable(index) {
  const status = props.applianceState.status
  // 有食材状态：食材可拖拽
  if (status === 'hasIngredients') {
    return !!props.applianceState.ingredients[index]
  }
  // 完成状态：成品可拖拽
  if (status === 'done') {
    return index === 0 && !!props.applianceState.outputDish
  }
  return false
}

// 开始拖拽槽位内容
function handleSlotDragStart(e, index) {
  const status = props.applianceState.status
  const content = getSlotContent(index)
  if (!content) return
  
  // 阻止事件冒泡，防止触发厨具本身的拖拽
  e.stopPropagation()
  
  // 创建自定义拖拽预览卡片
  const dragPreview = document.createElement('div')
  dragPreview.className = 'drag-preview-card'
  dragPreview.style.cssText = `
    position: fixed;
    top: -1000px;
    left: -1000px;
    width: 80px;
    height: 80px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #ffd700;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    box-sizing: border-box;
    box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
    z-index: 9999;
    pointer-events: none;
  `
  
  // 添加图片或图标
  if (content.image) {
    const img = document.createElement('img')
    img.src = content.image
    img.style.cssText = 'width: 40px; height: 40px; object-fit: contain;'
    dragPreview.appendChild(img)
  } else {
    const icon = document.createElement('span')
    icon.textContent = content.icon || '❓'
    icon.style.cssText = 'font-size: 30px;'
    dragPreview.appendChild(icon)
  }
  
  // 添加名称
  const name = document.createElement('span')
  name.textContent = content.name || '未知'
  name.style.cssText = 'font-size: 10px; color: #fff; text-align: center; margin-top: 4px; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;'
  dragPreview.appendChild(name)
  
  document.body.appendChild(dragPreview)
  
  // 设置拖拽图像
  e.dataTransfer.setDragImage(dragPreview, 40, 40)
  
  // 延迟移除预览元素
  setTimeout(() => {
    document.body.removeChild(dragPreview)
  }, 0)
  
  if (status === 'hasIngredients') {
    // 拖拽未处理的食材
    e.dataTransfer.setData('text/plain', `appliance-ingredient:${props.applianceId}:${index}`)
    
    // 使用 content 中已有的类型，可能是 ingredient/prepared/seasoning
    const itemType = content?.type || 'ingredient'
    
    emit('ingredient-drag-start', {
      type: itemType,
      applianceId: props.applianceId,
      slotIndex: index,
      content: {
        ...content,
        type: itemType  // 确保类型字段存在
      }
    })
  } else if (status === 'done') {
    // 拖拽完成的成品
    e.dataTransfer.setData('text/plain', `appliance-dish:${props.applianceId}`)
    
    // 判断是备菜还是成品菜
    const outputDish = props.applianceState.outputDish
    const isPrepared = !!preparedIngredients[outputDish?.id]
    const itemType = isPrepared ? 'prepared' : 'dish'
    
    emit('ingredient-drag-start', {
      type: itemType,
      applianceId: props.applianceId,
      slotIndex: 0,
      content: {
        ...outputDish,
        type: itemType  // 确保 content 中也包含正确的类型
      }
    })
  }
  
  e.dataTransfer.effectAllowed = 'move'
}

// 拖拽结束
function handleSlotDragEnd(e) {
  emit('ingredient-drag-end')
}
</script>

<template>
  <div 
    class="appliance-item"
    :class="[
      sizeClass, 
      applianceState.status, 
      getDragTargetClass(),
      { locked: locked }
    ]"
    @dragover="handleDragOver"
    @dragleave="emit('dragleave', $event)"
    @drop="handleDrop"
    @click="handleClick"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- 空闲状态：显示厨具图片（垃圾桶使用特殊布局） -->
    <div class="appliance-icon" v-if="applianceState.status === 'idle' && !isTrashBin">
      <img v-if="applianceData?.image" :src="applianceData.image" :alt="applianceData.name" class="appliance-img" />
      <span v-else>{{ applianceData?.icon || '❓' }}</span>
    </div>
    
    <!-- 垃圾桶特殊布局：容量槽 + 清理按钮 -->
    <div 
      class="trash-bin-layout" 
      v-if="isTrashBin && (applianceState.status === 'idle' || applianceState.status === 'hasIngredients')"
    >
      <!-- 容量显示区域 -->
      <div class="trash-capacity-container">
        <div class="trash-capacity-empty"></div>
        <div 
          class="trash-capacity-fill" 
          :style="{ height: ((applianceState.trashCount || 0) / (applianceData?.capacity || 20) * 100) + '%' }"
        ></div>
      </div>
      <!-- 底部操作区域 -->
      <div class="trash-action-row">
        <span class="trash-label">{{ getDisplayName() }}</span>
        <button 
          class="action-btn trash-clean-btn" 
          @click.stop="handleStartCooking"
          :disabled="!applianceState.trashCount || applianceState.trashCount <= 0"
        >
          清理
        </button>
      </div>
    </div>
    
    <!-- 垃圾桶清理中状态 -->
    <div class="trash-bin-layout" v-else-if="isTrashBin && applianceState.status === 'cleaning'">
      <div class="trash-capacity-container">
        <div class="trash-capacity-empty"></div>
        <div 
          class="trash-capacity-fill cleaning" 
          :style="{ height: ((applianceState.trashCount || 0) / (applianceData?.capacity || 20) * 100) + '%' }"
        ></div>
      </div>
      <div class="trash-action-row">
        <span class="trash-label">清理中...</span>
        <div class="trash-progress">
          <div class="trash-progress-fill" :style="{ width: applianceState.progress + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- 有食材或处理中或完成状态：动态布局（垃圾桶除外） -->
    <div 
      class="has-ingredients-layout" 
      v-else-if="!isTrashBin && (applianceState.status === 'hasIngredients' || applianceState.status === 'processing' || applianceState.status === 'done')"
      :style="{ 
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gridTemplateRows: `repeat(${contentRows}, minmax(0, 1fr)) auto`
      }"
    >
      <!-- 食材槽，数量 = 容量 -->
      <div 
        v-for="slotIndex in capacity" 
        :key="slotIndex" 
        class="ingredient-slot"
        :class="{ 
          'has-item': getSlotContent(slotIndex - 1),
          'is-processing': applianceState.status === 'processing',
          'is-draggable': isSlotDraggable(slotIndex - 1)
        }"
        :draggable="isSlotDraggable(slotIndex - 1)"
        @dragstart="handleSlotDragStart($event, slotIndex - 1)"
        @dragend="handleSlotDragEnd"
      >
        <template v-if="getSlotContent(slotIndex - 1)">
          <img 
            v-if="getSlotContent(slotIndex - 1).image" 
            :src="getSlotContent(slotIndex - 1).image" 
            :alt="getSlotContent(slotIndex - 1).name" 
            class="slot-img" 
          />
          <span v-else class="slot-icon">{{ getSlotContent(slotIndex - 1).icon }}</span>
          <!-- 堆叠数量角标 -->
          <span 
            v-if="getSlotContent(slotIndex - 1).count > 1" 
            class="stack-badge"
          >
            {{ getSlotContent(slotIndex - 1).count }}
          </span>
        </template>
      </div>
      <!-- 底部区域，跨所有列 -->
      <div class="action-row" :style="{ gridColumn: `1 / ${gridCols + 1}` }">
        <!-- 有食材状态：按钮 -->
        <button 
          v-if="applianceState.status === 'hasIngredients'"
          class="action-btn start-btn" 
          @click.stop="handleStartCooking"
        >
          {{ actionButtonText.replace(/^.+\s/, '') }}
        </button>
        <!-- 处理中状态：文字 + 进度条 -->
        <div v-else-if="applianceState.status === 'processing'" class="processing-section">
          <span class="processing-text">处理中</span>
          <div class="inline-progress">
            <div class="inline-progress-fill" :style="{ width: applianceState.progress + '%' }"></div>
          </div>
        </div>
        <!-- 完成状态：显示完成文字 + 烧糊进度条 -->
        <div v-else-if="applianceState.status === 'done'" class="done-section">
          <span class="done-text" :class="{ warning: canBurn && applianceState.burnProgress > 50 }">
            {{ canBurn && applianceState.burnProgress > 50 ? '快糊了' : '完成' }}
          </span>
          <div v-if="canBurn" class="inline-burn-progress">
            <div class="inline-burn-fill" :style="{ width: applianceState.burnProgress + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 烧焦状态 -->
    <div class="appliance-icon burned-icon" v-else-if="applianceState.status === 'burned'">
      <span>🔥</span>
    </div>
    
    <!-- 清理状态 -->
    <div class="appliance-icon" v-else-if="applianceState.status === 'cleaning'">
      <span>🧹</span>
    </div>
    
    <!-- 损坏状态 -->
    <div class="broken-layout" v-else-if="applianceState.status === 'broken'">
      <div class="broken-icon">
        <span>🔧</span>
      </div>
      <div class="broken-info">
        <span class="broken-text">损坏了!</span>
        <button class="repair-btn" @click.stop="emit('repair', applianceId)">
          🛠️ 修理
        </button>
      </div>
    </div>
    
    <!-- 修理中状态 -->
    <div class="repairing-layout" v-else-if="applianceState.status === 'repairing'">
      <div class="repairing-icon">
        <span>🔧</span>
      </div>
      <div class="repairing-info">
        <span class="repairing-text">修理中...</span>
        <div class="repairing-progress">
          <div class="repairing-progress-fill" :style="{ width: applianceState.progress + '%' }"></div>
        </div>
      </div>
    </div>
    
    <!-- 专属事件状态 -->
    <div class="special-event-layout" v-else-if="eventConfig">
      <div class="special-event-icon" :class="eventConfig.status">
        <span>{{ eventConfig.icon }}</span>
      </div>
      <div class="special-event-info">
        <span class="special-event-text">{{ eventConfig.name }}</span>
        <button class="special-event-btn" @click.stop="emit('special-action', applianceId)">
          {{ eventConfig.actionText }}
          <span v-if="eventConfig.actionCost" class="action-cost">💰{{ eventConfig.actionCost }}</span>
        </button>
      </div>
    </div>
    
    <!-- 厨具名称/状态（只在空闲、烧焦、清理状态显示，垃圾桶除外） -->
    <div class="appliance-name" v-if="!isTrashBin && (applianceState.status === 'idle' || applianceState.status === 'burned' || applianceState.status === 'cleaning')">{{ getDisplayName() }}</div>

    <!-- 清理进度条（垃圾桶除外） -->
    <div class="appliance-progress" v-if="!isTrashBin && applianceState.status === 'cleaning'">
      <div class="progress-fill" :style="{ width: applianceState.progress + '%' }"></div>
    </div>

    <!-- 提示文字 -->
    <div class="appliance-hint burn" v-if="applianceState.status === 'burned'">🧹 点击清理</div>
  </div>
</template>

<style scoped>
.appliance-item {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #666;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.appliance-item:not(.locked):hover {
  border-color: var(--gold);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.appliance-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 有食材状态 */
.appliance-item.hasIngredients {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
}

.appliance-item.processing {
  border-color: var(--warning-orange);
  animation: appliance-glow 1s ease-in-out infinite;
}

.appliance-item.done {
  border-color: var(--success-green);
  animation: appliance-done 0.8s ease-in-out infinite;
  cursor: pointer;
}

.appliance-item.burned {
  border-color: var(--danger-red);
  background: rgba(239, 68, 68, 0.2);
  animation: appliance-burn 0.5s ease-in-out infinite;
}

.appliance-item.cleaning {
  border-color: #60a5fa;
  animation: appliance-clean 1s ease-in-out infinite;
}

/* 损坏状态 */
.appliance-item.broken {
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.2);
  animation: appliance-broken 0.8s ease-in-out infinite;
}

/* 修理中状态 */
.appliance-item.repairing {
  border-color: #a78bfa;
  animation: appliance-repairing 1s ease-in-out infinite;
}

/* 专属事件状态 */
.appliance-item.flipped,
.appliance-item.spatula_broken {
  border-color: #fbbf24;
  background: rgba(251, 191, 36, 0.2);
  animation: appliance-wobble 0.5s ease-in-out infinite;
}

.appliance-item.exploded {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.3);
  animation: appliance-explode 0.3s ease-in-out infinite;
}

.appliance-item.crazy {
  border-color: #8b5cf6;
  background: rgba(139, 92, 246, 0.2);
  animation: appliance-spin 0.5s linear infinite;
}

.appliance-item.self_burn {
  border-color: #f97316;
  background: rgba(249, 115, 22, 0.3);
  animation: appliance-fire 0.4s ease-in-out infinite;
}

@keyframes appliance-wobble {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes appliance-explode {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes appliance-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes appliance-fire {
  0%, 100% { box-shadow: 0 0 15px rgba(249, 115, 22, 0.5); }
  50% { box-shadow: 0 0 30px rgba(249, 115, 22, 0.9); }
}

/* 拖放相关样式 */
.appliance-item.drag-can-drop {
  border-color: var(--success-green);
  background: rgba(74, 222, 128, 0.15);
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.4);
}

.appliance-item.drag-cannot-drop {
  border-color: var(--danger-red);
  background: rgba(239, 68, 68, 0.15);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
}

.appliance-item.drag-unavailable {
  opacity: 0.6;
}

.appliance-item.drag-over {
  border-color: var(--success-green);
  background: rgba(74, 222, 128, 0.3);
  box-shadow: 0 0 25px rgba(74, 222, 128, 0.6);
}

.appliance-item.drag-invalid {
  border-color: var(--danger-red);
  background: rgba(239, 68, 68, 0.2);
}

@keyframes appliance-glow {
  0%, 100% { box-shadow: 0 0 10px rgba(251, 146, 60, 0.3); }
  50% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.6); }
}

@keyframes appliance-done {
  0%, 100% { box-shadow: 0 0 10px rgba(74, 222, 128, 0.4); }
  50% { box-shadow: 0 0 25px rgba(74, 222, 128, 0.8); }
}

@keyframes appliance-burn {
  0%, 100% { box-shadow: 0 0 10px rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.7); }
}

@keyframes appliance-clean {
  0%, 100% { box-shadow: 0 0 10px rgba(96, 165, 250, 0.3); }
  50% { box-shadow: 0 0 15px rgba(96, 165, 250, 0.5); }
}

/* 厨具提示文字 */
.appliance-hint {
  position: absolute;
  bottom: 8px;
  font-size: 9px;
  color: var(--success-green);
  font-weight: bold;
  animation: hint-blink 1s ease-in-out infinite;
}

.appliance-hint.burn {
  color: var(--danger-red);
}

.appliance-hint.warning {
  color: var(--warning-orange);
}

@keyframes hint-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 厨具占位大小 */
.appliance-item.size-3x2 {
  grid-column: span 3;
  grid-row: span 2;
}

.appliance-item.size-2x2 {
  grid-column: span 2;
  grid-row: span 2;
}

.appliance-item.size-1x2 {
  grid-column: span 1;
  grid-row: span 2;
}

.appliance-item.size-2x1 {
  grid-column: span 2;
  grid-row: span 1;
}

.appliance-item.size-1x1 {
  grid-column: span 1;
  grid-row: span 1;
}

.appliance-icon {
  font-size: 40px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.appliance-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.appliance-name {
  font-size: 12px;
  color: var(--text-light);
  text-align: center;
}

/* 有食材时的布局 */
.has-ingredients-layout {
  width: 100%;
  height: 100%;
  display: grid;
  padding: 8px;
  box-sizing: border-box;
  gap: 6px;
  overflow: hidden;
}

/* 食材槽 - 不超出容器 */
.ingredient-slot {
  min-width: 0;
  min-height: 0;
  max-width: 100%;
  max-height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #555;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

/* 堆叠数量角标 - 与食材卡片保持一致 */
.stack-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 16px;
  background: #4ade80;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  z-index: 1;
}

/* 第3行：按钮 */
.action-row {
  grid-column: 1 / 4;
  display: flex;
  gap: 6px;
  height: 28px;
}

.ingredient-slot.has-item {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
}

.ingredient-slot.is-draggable {
  cursor: grab;
}

.ingredient-slot.is-draggable:hover {
  border-color: var(--success-green);
  box-shadow: 0 0 8px rgba(74, 222, 128, 0.4);
}

.ingredient-slot.is-draggable:active {
  cursor: grabbing;
}

.slot-img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
}

.slot-icon {
  font-size: 20px;
}

.action-row .action-btn {
  flex: 1;
  padding: 0 8px;
  border: 1px solid #555;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: all 0.2s;
}

.action-row .start-btn {
  background: var(--success-green);
  color: white;
  border-color: var(--success-green);
}

.action-row .start-btn:hover {
  background: #22c55e;
}

.action-row .done-btn {
  background: var(--success-green);
  color: white;
  border-color: var(--success-green);
  cursor: default;
}

/* 处理中区域 */
.processing-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.processing-text {
  font-size: 11px;
  color: var(--warning-orange);
  font-weight: bold;
}

.action-row .clear-btn {
  background: rgba(0, 0, 0, 0.4);
  color: #aaa;
}

.action-row .clear-btn:hover {
  background: var(--danger-red);
  color: white;
  border-color: var(--danger-red);
}

.appliance-progress {
  width: 90%;
  height: 6px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
  position: absolute;
  bottom: 10px;
}

.appliance-progress .progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--warning-orange), var(--success-green));
  transition: width 0.1s;
}

/* 处理中进度条 */
.inline-progress {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.inline-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--warning-orange), var(--success-green));
  transition: width 0.1s;
}

/* 完成状态区域 */
.done-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.done-text {
  font-size: 12px;
  font-weight: bold;
  color: var(--success-green);
}

.done-text.warning {
  color: var(--danger-red);
  animation: warning-blink 0.5s ease-in-out infinite;
}

@keyframes warning-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 烧糊进度条（内联版） */
.inline-burn-progress {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.inline-burn-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--success-green), var(--warning-orange), var(--danger-red));
  transition: width 0.1s;
}

/* 垃圾桶特殊样式 */
.trash-bin-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 8px;
  box-sizing: border-box;
  gap: 8px;
}

.trash-capacity-container {
  flex: 1;
  position: relative;
  border: 1px solid #555;
  border-radius: 6px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
}

.trash-capacity-empty {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.trash-capacity-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #a3e635;
  transition: height 0.3s ease;
}

.trash-capacity-fill.cleaning {
  animation: trash-cleaning-pulse 0.5s ease-in-out infinite;
}

@keyframes trash-cleaning-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.trash-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 28px;
}

.trash-label {
  font-size: 11px;
  color: var(--text-light);
  white-space: nowrap;
}

.trash-clean-btn {
  padding: 4px 12px;
  background: var(--success-green);
  color: white;
  border: 1px solid var(--success-green);
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.trash-clean-btn:hover:not(:disabled) {
  background: #22c55e;
}

.trash-clean-btn:disabled {
  background: #555;
  border-color: #555;
  color: #888;
  cursor: not-allowed;
}

.trash-progress {
  flex: 1;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.trash-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--warning-orange), var(--success-green));
  transition: width 0.1s;
}

/* 损坏状态布局 */
.broken-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
}

.broken-icon {
  font-size: 36px;
  animation: shake 0.5s ease-in-out infinite;
}

.broken-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.broken-text {
  font-size: 12px;
  color: #f97316;
  font-weight: bold;
}

.repair-btn {
  padding: 4px 12px;
  background: #a78bfa;
  color: white;
  border: 1px solid #a78bfa;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.repair-btn:hover {
  background: #8b5cf6;
  border-color: #8b5cf6;
  transform: scale(1.05);
}

/* 修理中状态布局 */
.repairing-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
}

.repairing-icon {
  font-size: 36px;
  animation: rotate 1s linear infinite;
}

.repairing-info {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.repairing-text {
  font-size: 12px;
  color: #a78bfa;
  font-weight: bold;
}

.repairing-progress {
  width: 80%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.repairing-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #a78bfa, #8b5cf6);
  transition: width 0.1s;
}

/* 损坏和修理动画 */
@keyframes appliance-broken {
  0%, 100% { box-shadow: 0 0 10px rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 20px rgba(249, 115, 22, 0.7); }
}

@keyframes appliance-repairing {
  0%, 100% { box-shadow: 0 0 10px rgba(167, 139, 250, 0.3); }
  50% { box-shadow: 0 0 15px rgba(167, 139, 250, 0.5); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-2deg); }
  75% { transform: translateX(3px) rotate(2deg); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 专属事件布局 */
.special-event-layout {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  box-sizing: border-box;
}

.special-event-icon {
  font-size: 36px;
}

.special-event-icon.flipped {
  animation: wobble-icon 0.5s ease-in-out infinite;
}

.special-event-icon.spatula_broken {
  animation: shake 0.5s ease-in-out infinite;
}

.special-event-icon.exploded {
  animation: explode-icon 0.3s ease-in-out infinite;
}

.special-event-icon.crazy {
  animation: spin-icon 0.3s linear infinite;
}

.special-event-icon.self_burn {
  animation: fire-icon 0.4s ease-in-out infinite;
}

@keyframes wobble-icon {
  0%, 100% { transform: rotate(-15deg); }
  50% { transform: rotate(15deg); }
}

@keyframes explode-icon {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.3); }
}

@keyframes spin-icon {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fire-icon {
  0%, 100% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.3); }
}

.special-event-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.special-event-text {
  font-size: 12px;
  color: #fbbf24;
  font-weight: bold;
}

.special-event-btn {
  padding: 4px 10px;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #000;
  border: none;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.special-event-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
}

.action-cost {
  font-size: 10px;
  opacity: 0.9;
}
</style>
