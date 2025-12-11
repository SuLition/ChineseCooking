<script setup>
/**
 * 食材卡片组件
 * 支持拖放功能，显示库存数量
 */
const props = defineProps({
  ingredient: {
    type: Object,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['dragstart', 'dragend'])

function handleDragStart(e) {
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
  
  // 添加图片或图标
  if (props.ingredient.image) {
    const img = document.createElement('img')
    img.src = props.ingredient.image
    img.style.cssText = 'width: 40px; height: 40px; object-fit: contain;'
    dragPreview.appendChild(img)
  } else {
    const icon = document.createElement('span')
    icon.textContent = props.ingredient.icon || '❓'
    icon.style.cssText = 'font-size: 30px;'
    dragPreview.appendChild(icon)
  }
  
  // 添加名称
  const name = document.createElement('span')
  name.textContent = props.ingredient.name || '未知'
  name.style.cssText = 'font-size: 10px; color: #fff; text-align: center; margin-top: 4px;'
  dragPreview.appendChild(name)
  
  document.body.appendChild(dragPreview)
  e.dataTransfer.setDragImage(dragPreview, 40, 40)
  setTimeout(() => document.body.removeChild(dragPreview), 0)
  
  emit('dragstart', e)
}

function handleDragEnd(e) {
  emit('dragend', e)
}
</script>

<template>
  <div 
    class="ingredient-item" 
    :draggable="stock > 0"
    :class="{ 'out-of-stock': stock <= 0 }"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <div class="ingredient-icon">
      <img v-if="ingredient.image" :src="ingredient.image" :alt="ingredient.name" class="ingredient-img" />
      <span v-else>{{ ingredient.icon }}</span>
    </div>
    <div class="ingredient-name">{{ ingredient.name }}</div>
    <div class="ingredient-stock" :class="{ low: stock <= 3, out: stock === 0 }">
      {{ stock }}
    </div>
  </div>
</template>

<style scoped>
.ingredient-item {
  background: rgba(0, 0, 0, 0.4);
  border: 2px solid #666;
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: grab;
  transition: all 0.2s;
  position: relative;
  height: 80px;
  justify-content: center;
}

.ingredient-item:hover {
  border-color: var(--gold);
}

.ingredient-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.ingredient-item.out-of-stock {
  opacity: 0.4;
  cursor: not-allowed;
}

.ingredient-icon {
  font-size: 30px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ingredient-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ingredient-name {
  font-size: 12px;
  color: var(--text-light);
  text-align: center;
}

.ingredient-stock {
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

.ingredient-stock.low {
  background: #fb923c;
}

.ingredient-stock.out {
  background: #ef4444;
  color: #fff;
}
</style>
