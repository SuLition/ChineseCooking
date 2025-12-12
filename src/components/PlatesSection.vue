<script setup>
import { ref } from 'vue'
import { PLATE_STATUS } from '../game/constants'

/**
 * 盘子区域组件
 * 盘子状态：
 * - empty: 空盘，可接收成品菜
 * - hasDish: 有成品菜，可拖放到顾客
 * - served: 上菜完毕，需要清洗
 */
const props = defineProps({
  // 盘子数据数组 [{ status, dish }, ...]
  plates: {
    type: Array,
    default: () => []
  },
  // 盘子数量
  plateCount: {
    type: Number,
    default: 3
  },
  // 是否有食材正在拖拽
  isDraggingItem: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['clear', 'wash', 'drag-start', 'drag-end', 'drop-item', 'dragover', 'dragleave'])

// 当前拖拽的盘子索引
const draggingPlateIndex = ref(-1)
// 当前悬停的盘子索引
const hoverPlateIndex = ref(-1)
// 按钮悬停状态
const btnHoverIndex = ref(-1)

// 获取盘子数据
function getPlate(index) {
  return props.plates[index] || { status: PLATE_STATUS.EMPTY, dish: null }
}

// 获取盘子状态class
function getPlateClass(index) {
  const plate = getPlate(index)
  return {
    'is-empty': plate.status === PLATE_STATUS.EMPTY,
    'has-dish': plate.status === PLATE_STATUS.HAS_DISH,
    'is-dirty': plate.status === PLATE_STATUS.DIRTY,
    'is-washing': plate.status === PLATE_STATUS.WASHING,
    'is-dragging': draggingPlateIndex.value === index,
    'is-drop-target': hoverPlateIndex.value === index && props.isDraggingItem
  }
}

// 盘子是否可拖拽（有成品菜的盘子可以拖放）
function isPlateDraggable(index) {
  const plate = getPlate(index)
  return plate.status === PLATE_STATUS.HAS_DISH && !!plate.dish
}

// 盘子是否可接收成品菜
function canAcceptItem(index) {
  const plate = getPlate(index)
  // 只有空盘可以接收
  return plate.status === PLATE_STATUS.EMPTY
}

// 开始拖拽盘子
function handleDragStart(e, plateIndex) {
  const plate = getPlate(plateIndex)
  
  // 只有有成品菜的盘子才能拖拽
  if (plate.status !== PLATE_STATUS.HAS_DISH || !plate.dish) {
    e.preventDefault()
    return
  }
  
  // 创建自定义拖拽预览卡片
  const dragPreview = document.createElement('div')
  dragPreview.style.cssText = `
    position: fixed;
    top: -1000px;
    left: -1000px;
    width: 100px;
    height: 100px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #4ade80;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    box-sizing: border-box;
    box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4);
    z-index: 9999;
    pointer-events: none;
  `
  
  // 显示菜品图片或图标
  if (plate.dish?.image) {
    const img = document.createElement('img')
    img.src = plate.dish.image
    img.style.cssText = 'width: 50px; height: 50px; object-fit: contain;'
    dragPreview.appendChild(img)
  } else {
    const icon = document.createElement('span')
    icon.textContent = plate.dish?.icon || '🍽️'
    icon.style.cssText = 'font-size: 36px;'
    dragPreview.appendChild(icon)
  }
  
  // 显示菜名
  const name = document.createElement('span')
  name.textContent = plate.dish?.name || '菜品'
  name.style.cssText = 'font-size: 10px; color: #fff; text-align: center; margin-top: 4px;'
  dragPreview.appendChild(name)
  
  document.body.appendChild(dragPreview)
  e.dataTransfer.setDragImage(dragPreview, 50, 50)
  setTimeout(() => document.body.removeChild(dragPreview), 0)
  
  draggingPlateIndex.value = plateIndex
  e.dataTransfer.setData('text/plain', `plate:${plateIndex}`)
  e.dataTransfer.effectAllowed = 'move'
  emit('drag-start', plateIndex)
}

function handleDragEnd() {
  draggingPlateIndex.value = -1
  emit('drag-end')
}

// 盘子上的dragover
function handleDragOver(e, plateIndex) {
  if (!canAcceptItem(plateIndex)) return
  e.preventDefault()
  hoverPlateIndex.value = plateIndex
  emit('dragover', e, plateIndex)
}

function handleDragLeave(e, plateIndex) {
  hoverPlateIndex.value = -1
  emit('dragleave', e, plateIndex)
}

// 盘子上的drop
function handleDrop(e, plateIndex) {
  e.preventDefault()
  hoverPlateIndex.value = -1
  if (!canAcceptItem(plateIndex)) return
  emit('drop-item', e, plateIndex)
}

// 清空盘子
function handleClear(plateIndex) {
  emit('clear', plateIndex)
}

// 开始清洗
function handleWash(plateIndex) {
  emit('wash', plateIndex)
}
</script>

<template>
  <div class="plates-section">
    <!-- 所有盘子 -->
    <div 
      v-for="plateIndex in plateCount"
      :key="'plate-' + plateIndex"
      class="plate-item"
      :class="getPlateClass(plateIndex - 1)"
      :draggable="isPlateDraggable(plateIndex - 1) ? 'true' : 'false'"
      @dragstart="handleDragStart($event, plateIndex - 1)"
      @dragend="handleDragEnd"
      @dragover="handleDragOver($event, plateIndex - 1)"
      @dragleave="handleDragLeave($event, plateIndex - 1)"
      @drop="handleDrop($event, plateIndex - 1)"
    >
      <!-- 圆形盘子区域 -->
      <div class="plate-circle">
        <!-- 空盘 -->
        <template v-if="getPlate(plateIndex - 1).status === PLATE_STATUS.EMPTY">
          <span class="empty-icon">🍽️</span>
        </template>
        
        <!-- 有成品菜 - 只显示图片/图标 -->
        <template v-else-if="getPlate(plateIndex - 1).status === PLATE_STATUS.HAS_DISH && getPlate(plateIndex - 1).dish">
          <img 
            v-if="getPlate(plateIndex - 1).dish.image" 
            :src="getPlate(plateIndex - 1).dish.image" 
            :alt="getPlate(plateIndex - 1).dish.name"
            class="dish-img"
          />
          <span v-else class="dish-icon">{{ getPlate(plateIndex - 1).dish.icon || '🍽️' }}</span>
        </template>
        
        <!-- 待清洗状态 -->
        <template v-else-if="getPlate(plateIndex - 1).status === PLATE_STATUS.DIRTY">
          <span class="dirty-icon">🧹</span>
        </template>
        
        <!-- 清洗中状态 - 只显示图标 -->
        <template v-else-if="getPlate(plateIndex - 1).status === PLATE_STATUS.WASHING">
          <span class="washing-icon">🧼</span>
        </template>
      </div>
      
      <!-- 下方按钮 / 清洗进度条 -->
      <!-- 清洗中显示进度条 -->
      <div v-if="getPlate(plateIndex - 1).status === PLATE_STATUS.WASHING" class="wash-progress-bar">
        <div 
          class="wash-progress-fill" 
          :style="{ width: (getPlate(plateIndex - 1).washProgress || 0) + '%' }"
        ></div>
        <span class="wash-progress-text">清洗中...</span>
      </div>
      <!-- 其他状态显示按钮 -->
      <button 
        v-else
        class="plate-btn"
        draggable="false"
        :disabled="getPlate(plateIndex - 1).status === PLATE_STATUS.EMPTY"
        @click.stop="getPlate(plateIndex - 1).status === PLATE_STATUS.DIRTY ? handleWash(plateIndex - 1) : handleClear(plateIndex - 1)"
        @mouseenter="btnHoverIndex = plateIndex - 1"
        @mouseleave="btnHoverIndex = -1"
        @dragstart.stop.prevent
      >
        <!-- 有菜 -->
        <template v-if="getPlate(plateIndex - 1).status === PLATE_STATUS.HAS_DISH">
          {{ btnHoverIndex === plateIndex - 1 ? '清空' : getPlate(plateIndex - 1).dish?.name || '菜品' }}
        </template>
        <!-- 待清洗 -->
        <template v-else-if="getPlate(plateIndex - 1).status === PLATE_STATUS.DIRTY">
          点击清洗
        </template>
        <!-- 空盘 -->
        <template v-else>
          空
        </template>
      </button>
    </div>
  </div>
</template>

<style scoped>
.plates-section {
  flex: 1;
  height: 100%;
  display: flex;
  gap: 12px;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid var(--light-wood);
  border-radius: 12px;
  padding: 10px;
  box-sizing: border-box;
}

.plate-item {
  /* width: 75px; */
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid #666;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
  /* gap: 8px; */
  transition: all 0.2s;
  box-sizing: border-box;
}

/* 空盘状态 */
.plate-item.is-empty {
  border-color: #666;
}

/* 有成品菜状态 - 可拖拽 */
.plate-item.has-dish {
  border-color: var(--success-green);
  cursor: grab;
}

.plate-item.has-dish:active {
  cursor: grabbing;
}

/* 确保子元素不阻止拖拽 */
.plate-item.has-dish .plate-circle,
.plate-item.has-dish .dish-img,
.plate-item.has-dish .dish-icon {
  pointer-events: none;
}

/* 上菜完毕状态 - 待清洗 */
.plate-item.is-dirty {
  border-color: #f59e0b;
}

.plate-item.is-dirty .plate-circle {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

/* 清洗中状态 */
.plate-item.is-washing {
  border-color: #3b82f6;
}

.plate-item.is-washing .plate-circle {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

/* 拖拽中 */
.plate-item.is-dragging {
  opacity: 0.5;
}

/* 拖放目标 */
.plate-item.is-drop-target {
  border-color: var(--gold);
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
}

/* 圆形盘子区域 */
.plate-circle {
  /* flex: 1; */
  width: 64px;
  height: 64px;
  aspect-ratio: 1;
  max-width: 100%;
  margin: 0 auto;
  border: 1px solid #555;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.2s;
}

.plate-item.has-dish .plate-circle {
  border-color: var(--success-green);
  background: rgba(74, 222, 128, 0.1);
}

.plate-item.is-drop-target .plate-circle {
  border-color: var(--gold);
  background: rgba(255, 215, 0, 0.1);
}

.empty-icon {
  font-size: 24px;
  opacity: 0.5;
}

.dish-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.dish-icon {
  font-size: 32px;
}

.dirty-icon {
  font-size: 28px;
  opacity: 0.8;
}

.washing-icon {
  font-size: 28px;
  animation: washing-bounce 0.5s ease-in-out infinite;
}

@keyframes washing-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* 清洗进度条 - 替代按钮位置 */
.wash-progress-bar {
  width: 100%;
  height: 20px;
  background: #333;
  border: 2px solid #3b82f6;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wash-progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  transition: width 0.1s linear;
}

.wash-progress-text {
  position: relative;
  z-index: 1;
  font-size: 10px;
  color: #fff;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 盘子按钮 */
.plate-btn {
  width: 100%;
  height: 20px;
  border: 2px solid #555;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #888;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.plate-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.3);
  border-color: var(--danger-red);
  color: var(--danger-red);
}

.plate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.plate-item.has-dish .plate-btn {
  border-color: var(--success-green);
  color: var(--success-green);
}

/* 待清洗状态按钮 */
.plate-item.is-dirty .plate-btn {
  border-color: #f59e0b;
  color: #f59e0b;
  animation: pulse-orange 1s ease-in-out infinite;
}

.plate-item.is-dirty .plate-btn:hover:not(:disabled) {
  background: rgba(59, 130, 246, 0.3);
  border-color: #3b82f6;
  color: #3b82f6;
}

@keyframes pulse-orange {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 清洗中状态按钮 */
.plate-item.is-washing .plate-btn {
  border-color: #3b82f6;
  color: #3b82f6;
}
</style>
