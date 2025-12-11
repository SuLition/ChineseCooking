<script setup>
/**
 * 调料区域组件
 * 显示可拖放的调料列表
 */
import { seasonings } from '../game/data/ingredients'

const props = defineProps({
  // 调料库存 { salt: 80, soy_sauce: 100, ... }
  seasoningStock: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['dragstart', 'dragend'])

// 获取调料列表
const seasoningList = Object.entries(seasonings).map(([id, data]) => ({
  id,
  ...data
}))

// 获取调料剩余百分比（当前瓶的剩余量）
function getRemainPercent(seasoningId) {
  const seasoning = seasonings[seasoningId]
  const stock = props.seasoningStock[seasoningId]
  const currentAmount = stock?.currentAmount ?? seasoning?.maxAmount ?? 100
  const max = seasoning?.maxAmount || 100
  return Math.min(100, (currentAmount / max) * 100)
}

// 获取调料瓶数（库存）
function getBottles(seasoningId) {
  const stock = props.seasoningStock[seasoningId]
  return stock?.bottles ?? 1
}

// 获取当前瓶剩余量
function getCurrentAmount(seasoningId) {
  const seasoning = seasonings[seasoningId]
  const stock = props.seasoningStock[seasoningId]
  return stock?.currentAmount ?? seasoning?.maxAmount ?? 100
}

function handleDragStart(e, seasoningId) {
  const seasoning = seasonings[seasoningId]
  
  // 创建自定义拖拽预览卡片
  const dragPreview = document.createElement('div')
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
  
  // 添加调料图标
  const icon = document.createElement('span')
  icon.textContent = seasoning?.icon || '❓'
  icon.style.cssText = 'font-size: 30px;'
  dragPreview.appendChild(icon)
  
  // 添加名称
  const name = document.createElement('span')
  name.textContent = seasoning?.name || '未知'
  name.style.cssText = 'font-size: 10px; color: #fff; text-align: center; margin-top: 4px;'
  dragPreview.appendChild(name)
  
  document.body.appendChild(dragPreview)
  e.dataTransfer.setDragImage(dragPreview, 40, 40)
  setTimeout(() => document.body.removeChild(dragPreview), 0)
  
  // 使用新的统一 JSON 格式
  const dragData = JSON.stringify({
    type: 'seasoning',
    id: seasoningId,
    source: 'seasoning_bar',
    name: seasoning?.name || '未知',
    icon: seasoning?.icon || '❓',
    image: seasoning?.image || null,
    maxStack: seasoning?.maxStack || 3
  })
  
  emit('dragstart', e, seasoningId)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', dragData)
}

function handleDragEnd(e) {
  emit('dragend', e)
}
</script>

<template>
  <div class="seasonings-section">
    <div class="seasonings-grid">
      <div 
        v-for="seasoning in seasoningList"
        :key="seasoning.id"
        class="seasoning-item" 
        :class="{ 'low-stock': getRemainPercent(seasoning.id) < 30 }"
        draggable="true"
        @dragstart="handleDragStart($event, seasoning.id)"
        @dragend="handleDragEnd"
      >
        <div class="seasoning-stock">{{ getBottles(seasoning.id) }}</div>
        <div class="seasoning-icon">
          <img v-if="seasoning.image" :src="seasoning.image" class="seasoning-image" />
          <span v-else>{{ seasoning.icon }}</span>
        </div>
        <div class="seasoning-name">{{ seasoning.name }}</div>
        <div class="seasoning-progress">
          <div 
            class="progress-fill" 
            :style="{ width: getRemainPercent(seasoning.id) + '%' }"
            :class="{ low: getRemainPercent(seasoning.id) < 30 }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.seasonings-section {
  flex: 1;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #8b7355;
  border-radius: 12px;
  padding: 8px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.seasonings-grid {
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  flex-wrap: nowrap;
  overflow-x: auto;
}

.seasoning-item {
  height: 100%;
  width: 90px;
  min-width: 80px;
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #666;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 6px 14px;
  gap: 12px;
  cursor: grab;
  transition: all 0.2s;
  position: relative;
  box-sizing: border-box;
}

.seasoning-item:hover {
  border-color: #ffd700;
}

.seasoning-item.low-stock {
  border-color: #ef4444;
}

.seasoning-stock {
  position: absolute;
  top: 3px;
  right: 3px;
  min-width: 22px;
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
}

.seasoning-item.low-stock .seasoning-stock {
  background: #ef4444;
  color: #fff;
}

.seasoning-icon {
  width: 40px;
  height: 40px;
  font-size: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seasoning-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.seasoning-name {
  font-size: 14px;
  color: #f5e6d3;
}

.seasoning-progress {
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ade80, #22c55e);
  transition: width 0.3s;
}

.progress-fill.low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}
</style>
