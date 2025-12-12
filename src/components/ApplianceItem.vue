<script setup>
/**
 * 单个厨具组件
 */
import { computed, ref, inject } from 'vue'
import { appliances } from '../game/data/appliances'
import { preparedIngredients } from '../game/data/ingredients'
import { APPLIANCE_STATUS } from '../game/constants'

// 注入父组件提供的方法
const clickAppliance = inject('clickAppliance')
const repairAppliance = inject('repairAppliance')
const handleSpecialAction = inject('handleSpecialAction')
const getEventConfig = inject('getEventConfig')

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
  isPowerOutage: { type: Boolean, default: false }  // 停电状态
})

const emit = defineEmits(['dragover', 'dragleave', 'drop', 'start-cooking', 'clear', 'ingredient-drag-start', 'ingredient-drag-end'])

// 通过 inject 获取事件配置
const eventConfig = computed(() => getEventConfig?.(props.applianceId))

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

// 是否需要电力
const requiresPower = computed(() => applianceData.value?.requiresPower === true)

// 是否处于缺电状态（停电且需要电的厨具）
const isNoPower = computed(() => props.isPowerOutage && requiresPower.value)

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
    if (props.applianceState.status === APPLIANCE_STATUS.DONE) return 'drag-can-drop'
    return 'drag-unavailable'
  }
  // 如果正在拖拽食材/备菜/调料
  if (!props.draggingIngredient) return ''
  
  const status = props.applianceState.status
  
  // 垃圾桶特殊处理：接受所有类型的物品
  if (isTrashBin.value) {
    // 只有空闲或有垃圾状态才能添加
    if (status !== APPLIANCE_STATUS.IDLE && status !== APPLIANCE_STATUS.HAS_INGREDIENTS) return 'drag-unavailable'
    // 检查容量
    const currentCount = props.applianceState.trashCount || 0
    const capacity = applianceData.value?.capacity || 20
    if (currentCount >= capacity) return 'drag-cannot-drop'
    return 'drag-can-drop'
  }
  
  // 厨具必须是空闲、有食材或完成状态
  if (status !== APPLIANCE_STATUS.IDLE && status !== APPLIANCE_STATUS.HAS_INGREDIENTS && status !== APPLIANCE_STATUS.DONE) return 'drag-unavailable'
  
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
    if (appliance.status === APPLIANCE_STATUS.CLEANING) return '🗑️ 清理中...'
    const count = appliance.trashCount || 0
    const capacity = data?.capacity || 20
    return `垃圾桶: ${Math.round((count / capacity) * 100)}%`
  }
  
  if (appliance.status === APPLIANCE_STATUS.BURNED) return burnedText.value
  if (appliance.status === APPLIANCE_STATUS.CLEANING) return '🧹 清理中...'
  if (appliance.status === APPLIANCE_STATUS.BROKEN) return '🔧 损坏了!'
  if (appliance.status === APPLIANCE_STATUS.REPAIRING) return '🔧 修理中...'
  // 专属事件状态
  if (eventConfig.value) return eventConfig.value.icon + ' ' + eventConfig.value.name
  if (appliance.status === APPLIANCE_STATUS.PROCESSING) return '处理中...'
  if (appliance.status === APPLIANCE_STATUS.DONE) {
    // 显示成品菜名称
    return appliance.outputDish?.name || '❓ 未知菜品'
  }
  if (appliance.status === APPLIANCE_STATUS.HAS_INGREDIENTS) {
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
    clickAppliance?.(props.applianceId)
  }
}

// 修理厨具
function handleRepair() {
  repairAppliance?.(props.applianceId)
}

// 处理专属事件动作
function handleSpecialEventAction() {
  handleSpecialAction?.(props.applianceId)
}

function handleStartCooking() {
  emit('start-cooking', props.applianceId)
}

// 获取槽位内容（根据状态返回不同内容）
function getSlotContent(index) {
  if (props.applianceState.status === APPLIANCE_STATUS.DONE) {
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
  if (status === APPLIANCE_STATUS.HAS_INGREDIENTS) {
    return !!props.applianceState.ingredients[index]
  }
  // 完成状态：成品可拖拽
  if (status === APPLIANCE_STATUS.DONE) {
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
  
  if (status === APPLIANCE_STATUS.HAS_INGREDIENTS) {
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
  } else if (status === APPLIANCE_STATUS.DONE) {
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
      { locked: locked },
      { 'no-power': isNoPower }
    ]"
    @dragover="handleDragOver"
    @dragleave="emit('dragleave', $event)"
    @drop="handleDrop"
    @click="handleClick"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- 空闲状态：显示厨具图片（垃圾桶使用特殊布局） -->
    <div class="appliance-icon" v-if="applianceState.status === APPLIANCE_STATUS.IDLE && !isTrashBin">
      <img v-if="applianceData?.image" :src="applianceData.image" :alt="applianceData.name" class="appliance-img" />
      <span v-else>{{ applianceData?.icon || '❓' }}</span>
    </div>
    
    <!-- 垃圾桶特殊布局：容量槽 + 清理按钮 -->
    <div 
      class="trash-bin-layout" 
      v-if="isTrashBin && (applianceState.status === APPLIANCE_STATUS.IDLE || applianceState.status === APPLIANCE_STATUS.HAS_INGREDIENTS)"
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
    <div class="trash-bin-layout" v-else-if="isTrashBin && applianceState.status === APPLIANCE_STATUS.CLEANING">
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
      v-else-if="!isTrashBin && (applianceState.status === APPLIANCE_STATUS.HAS_INGREDIENTS || applianceState.status === APPLIANCE_STATUS.PROCESSING || applianceState.status === APPLIANCE_STATUS.DONE)"
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
          'is-processing': applianceState.status === APPLIANCE_STATUS.PROCESSING,
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
          v-if="applianceState.status === APPLIANCE_STATUS.HAS_INGREDIENTS"
          class="action-btn start-btn" 
          @click.stop="handleStartCooking"
        >
          {{ actionButtonText.replace(/^.+\s/, '') }}
        </button>
        <!-- 处理中状态：文字 + 进度条 -->
        <div v-else-if="applianceState.status === APPLIANCE_STATUS.PROCESSING" class="processing-section">
          <span class="processing-text">处理中</span>
          <div class="inline-progress">
            <div class="inline-progress-fill" :style="{ width: applianceState.progress + '%' }"></div>
          </div>
        </div>
        <!-- 完成状态：显示完成文字 + 烧糊进度条 -->
        <div v-else-if="applianceState.status === APPLIANCE_STATUS.DONE" class="done-section">
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
    <div class="appliance-icon burned-icon" v-else-if="applianceState.status === APPLIANCE_STATUS.BURNED">
      <span>🔥</span>
    </div>
    
    <!-- 清理状态 -->
    <div class="appliance-icon" v-else-if="applianceState.status === APPLIANCE_STATUS.CLEANING">
      <span>🧹</span>
    </div>
    
    <!-- 损坏状态 -->
    <div class="broken-layout" v-else-if="applianceState.status === APPLIANCE_STATUS.BROKEN">
      <div class="broken-icon">
        <span>🔧</span>
      </div>
      <div class="broken-info">
        <span class="broken-text">损坏了!</span>
        <button class="repair-btn" @click.stop="handleRepair">
          🛠️ 修理
        </button>
      </div>
    </div>
    
    <!-- 修理中状态 -->
    <div class="repairing-layout" v-else-if="applianceState.status === APPLIANCE_STATUS.REPAIRING">
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
        <button class="special-event-btn" @click.stop="handleSpecialEventAction">
          {{ eventConfig.actionText }}
          <span v-if="eventConfig.actionCost" class="action-cost">💰{{ eventConfig.actionCost }}</span>
        </button>
      </div>
    </div>
    
    <!-- 厨具名称/状态（只在空闲、烧焦、清理状态显示，垃圾桶除外） -->
    <div class="appliance-name" v-if="!isTrashBin && (applianceState.status === APPLIANCE_STATUS.IDLE || applianceState.status === APPLIANCE_STATUS.BURNED || applianceState.status === APPLIANCE_STATUS.CLEANING)">{{ getDisplayName() }}</div>

    <!-- 清理进度条（垃圾桶除外） -->
    <div class="appliance-progress" v-if="!isTrashBin && applianceState.status === APPLIANCE_STATUS.CLEANING">
      <div class="progress-fill" :style="{ width: applianceState.progress + '%' }"></div>
    </div>

    <!-- 提示文字 -->
    <div class="appliance-hint burn" v-if="applianceState.status === APPLIANCE_STATUS.BURNED">🧹 点击清理</div>
  </div>
</template>

<style scoped src="./styles/ApplianceItem.css"></style>
